import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from './entities/notification.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { User } from '../staff/entities/staff.entity';
import { Settings } from './entities/settings.entity';

export enum NotificationKind {
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Settings)
    private readonly settingsRepository: Repository<Settings>,
  ) {}

  async reservationChanged(
    reservation: Reservation,
    kind: NotificationKind,
    serviceName: string,
    clientName: string,
  ): Promise<void> {
    try {
      const staff = await this.userRepository.findOne({
        where: { id: reservation.staff_id },
      });

      if (!staff) {
        this.logger.warn(
          `Staff not found for reservation ${reservation.id}, skipping notification`,
        );
        return;
      }

      if (!staff.telegram_user_id) {
        this.logger.debug(
          `Staff ${staff.id} has no linked Telegram, skipping notification`,
        );
        return;
      }

      const settings = await this.settingsRepository.findOne({
        where: {},
        order: { created_at: 'DESC' },
      });

      const timezone = settings?.timezone || 'America/Bogota';

      let message: string;
      let notificationType: NotificationType;
      const metadata: Record<string, any> = {
        service_name: serviceName,
        client_name: clientName,
      };

      if (kind === NotificationKind.CANCELLED) {
        notificationType = NotificationType.RESERVATION_CANCELLED;
        const previousTime = this.formatTime(
          reservation.previous_start_time || reservation.start_time,
          timezone,
        );
        metadata.previous_start_time = previousTime;

        message = `🚫 Cancelación de reserva\n\n` +
          `Cliente: ${clientName}\n` +
          `Servicio: ${serviceName}\n` +
          `Horario cancelado: ${previousTime}\n\n` +
          `El horario ha quedado disponible.`;
      } else {
        notificationType = NotificationType.RESERVATION_RESCHEDULED;
        const previousTime = this.formatTime(
          reservation.previous_start_time,
          timezone,
        );
        const newTime = this.formatTime(reservation.start_time, timezone);
        metadata.previous_start_time = previousTime;
        metadata.new_start_time = newTime;

        message = `🔄 Reprogramación de reserva\n\n` +
          `Cliente: ${clientName}\n` +
          `Servicio: ${serviceName}\n` +
          `Horario anterior: ${previousTime}\n` +
          `Nuevo horario: ${newTime}\n\n` +
          `No te presentes al horario anterior.`;
      }

      const notification = this.notificationRepository.create({
        type: notificationType,
        recipient_id: staff.id,
        recipient_telegram_id: staff.telegram_user_id,
        reservation_id: reservation.id,
        message,
        metadata,
        status: NotificationStatus.PENDING,
      });

      await this.notificationRepository.save(notification);
      this.logger.log(
        `Created ${kind} notification for staff ${staff.id}, reservation ${reservation.id}`,
      );

    } catch (error) {
      this.logger.error(
        `Failed to create notification for reservation ${reservation.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  async staffUpcoming(
    reservation: Reservation,
    serviceName: string,
    clientName: string,
  ): Promise<void> {
    try {
      const staff = await this.userRepository.findOne({
        where: { id: reservation.staff_id },
      });

      if (!staff || !staff.telegram_user_id) {
        return;
      }

      const settings = await this.settingsRepository.findOne({
        where: {},
        order: { created_at: 'DESC' },
      });

      const timezone = settings?.timezone || 'America/Bogota';
      const startTime = this.formatTime(reservation.start_time, timezone);

      const message = `⏰ Próximo turno\n\n` +
        `Cliente: ${clientName}\n` +
        `Servicio: ${serviceName}\n` +
        `Horario: ${startTime}\n\n` +
        `Este turno comienza pronto.`;

      const notification = this.notificationRepository.create({
        type: NotificationType.STAFF_UPCOMING,
        recipient_id: staff.id,
        recipient_telegram_id: staff.telegram_user_id,
        reservation_id: reservation.id,
        message,
        metadata: {
          service_name: serviceName,
          client_name: clientName,
          start_time: startTime,
        },
        status: NotificationStatus.PENDING,
      });

      await this.notificationRepository.save(notification);
      this.logger.log(
        `Created upcoming notification for staff ${staff.id}, reservation ${reservation.id}`,
      );

    } catch (error) {
      this.logger.error(
        `Failed to create upcoming notification for reservation ${reservation.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  async getPendingNotifications(limit: number = 10): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { status: NotificationStatus.PENDING },
      order: { created_at: 'ASC' },
      take: limit,
    });
  }

  async markAsSent(notificationId: string): Promise<void> {
    await this.notificationRepository.update(notificationId, {
      status: NotificationStatus.SENT,
      sent_at: new Date(),
    });
  }

  async markAsFailed(notificationId: string, errorMessage: string): Promise<void> {
    await this.notificationRepository.update(notificationId, {
      status: NotificationStatus.FAILED,
      error_message: errorMessage,
    });
  }

  private formatTime(date: Date, timezone: string): string {
    if (!date) return '';
    
    try {
      return new Date(date).toLocaleString('es-CO', {
        timeZone: timezone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch (error) {
      this.logger.error(`Failed to format time: ${error.message}`);
      return date.toISOString();
    }
  }
}
