import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { NotificationsService, NotificationKind } from '../platform/notifications.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, ActorType } from '../audit/entities/audit-log.entity';

export interface CancelReservationDto {
  reservationId: string;
  actorId: string;
  actorRole: string;
  reason?: string;
}

export interface RescheduleReservationDto {
  reservationId: string;
  newStartTime: Date;
  actorId: string;
  actorRole: string;
}

export interface ReservationWithDetails extends Reservation {
  serviceName?: string;
  clientName?: string;
}

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
    private readonly notificationsService: NotificationsService,
    private readonly auditService: AuditService,
  ) {}

  async findOne(id: string): Promise<Reservation | null> {
    return this.reservationRepository.findOne({ where: { id } });
  }

  async findByStaffId(
    staffId: string,
    fromDate?: Date,
  ): Promise<Reservation[]> {
    const query = this.reservationRepository
      .createQueryBuilder('r')
      .where('r.staff_id = :staffId', { staffId })
      .andWhere('r.status IN (:...statuses)', {
        statuses: [ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED],
      });

    if (fromDate) {
      query.andWhere('r.start_time >= :fromDate', { fromDate });
    }

    return query
      .orderBy('r.start_time', 'ASC')
      .getMany();
  }

  async cancel(dto: CancelReservationDto): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation ${dto.reservationId} not found`,
      );
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        `Reservation ${dto.reservationId} cannot be cancelled (status: ${reservation.status})`,
      );
    }

    const previousValue = { ...reservation };

    reservation.status = ReservationStatus.CANCELLED;
    reservation.cancellation_reason = dto.reason || 'Cancelled by user';
    reservation.cancelled_by_user_id = dto.actorId;
    reservation.previous_start_time = reservation.start_time;

    await this.reservationRepository.save(reservation);

    this.logger.log(
      `Reservation ${reservation.id} cancelled by ${dto.actorId}`,
    );

    await this.auditService.record({
      action: AuditAction.RESERVATION_CANCELLED,
      actor_type: ActorType.USER,
      actor_id: dto.actorId,
      actor_role: dto.actorRole,
      entity_type: 'reservation',
      entity_id: reservation.id,
      previous_value: {
        status: previousValue.status,
        start_time: previousValue.start_time,
      },
      new_value: {
        status: reservation.status,
        cancellation_reason: reservation.cancellation_reason,
      },
    });

    const serviceName = await this.getServiceName(reservation.service_id);
    const clientName = await this.getClientName(reservation.client_id);

    await this.notificationsService.reservationChanged(
      reservation,
      NotificationKind.CANCELLED,
      serviceName,
      clientName,
    );

    return reservation;
  }

  async reschedule(dto: RescheduleReservationDto): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: dto.reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation ${dto.reservationId} not found`,
      );
    }

    if (reservation.status !== ReservationStatus.CONFIRMED) {
      throw new BadRequestException(
        `Reservation ${dto.reservationId} cannot be rescheduled (status: ${reservation.status})`,
      );
    }

    const previousValue = { ...reservation };

    reservation.previous_start_time = reservation.start_time;
    reservation.start_time = dto.newStartTime;
    reservation.reschedule_count += 1;
    reservation.rescheduled_by_user_id = dto.actorId;

    await this.reservationRepository.save(reservation);

    this.logger.log(
      `Reservation ${reservation.id} rescheduled by ${dto.actorId} from ${previousValue.start_time} to ${dto.newStartTime}`,
    );

    await this.auditService.record({
      action: AuditAction.RESERVATION_RESCHEDULED,
      actor_type: ActorType.USER,
      actor_id: dto.actorId,
      actor_role: dto.actorRole,
      entity_type: 'reservation',
      entity_id: reservation.id,
      previous_value: {
        start_time: previousValue.start_time,
        reschedule_count: previousValue.reschedule_count,
      },
      new_value: {
        start_time: reservation.start_time,
        reschedule_count: reservation.reschedule_count,
      },
    });

    const serviceName = await this.getServiceName(reservation.service_id);
    const clientName = await this.getClientName(reservation.client_id);

    await this.notificationsService.reservationChanged(
      reservation,
      NotificationKind.RESCHEDULED,
      serviceName,
      clientName,
    );

    return reservation;
  }

  private async getServiceName(serviceId: string): Promise<string> {
    return 'Service Name';
  }

  private async getClientName(clientId: string): Promise<string> {
    return 'Client Name';
  }
}
