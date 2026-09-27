import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { NotificationProcessorService } from './notification-processor.service';
import { Notification } from './entities/notification.entity';
import { User } from '../staff/entities/staff.entity';
import { Settings } from './entities/settings.entity';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Settings]),
    ScheduleModule.forRoot(),
    TelegramModule,
  ],
  providers: [NotificationsService, NotificationProcessorService],
  exports: [NotificationsService],
})
export class PlatformModule {}
