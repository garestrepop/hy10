import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class NotificationProcessorService implements OnModuleInit {
  private readonly logger = new Logger(NotificationProcessorService.name);
  private isProcessing = false;

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly telegramService: TelegramService,
  ) {}

  onModuleInit() {
    this.logger.log('Notification processor initialized');
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async processPendingNotifications(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    try {
      this.isProcessing = true;

      const notifications = await this.notificationsService.getPendingNotifications(10);

      if (notifications.length === 0) {
        return;
      }

      this.logger.log(`Processing ${notifications.length} pending notifications`);

      for (const notification of notifications) {
        if (!notification.recipient_telegram_id) {
          await this.notificationsService.markAsFailed(
            notification.id,
            'No Telegram ID for recipient',
          );
          continue;
        }

        const success = await this.telegramService.sendMessage({
          telegramUserId: notification.recipient_telegram_id,
          message: notification.message,
        });

        if (success) {
          await this.notificationsService.markAsSent(notification.id);
          this.logger.log(`Notification ${notification.id} sent successfully`);
        } else {
          await this.notificationsService.markAsFailed(
            notification.id,
            'Failed to send via Telegram',
          );
          this.logger.warn(`Failed to send notification ${notification.id}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing notifications: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isProcessing = false;
    }
  }
}
