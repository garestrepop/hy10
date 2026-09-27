import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { User } from '../staff/entities/staff.entity';
import { Settings } from './entities/settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Settings]),
  ],
  providers: [NotificationsService],
  exports: [NotificationsService, TypeOrmModule],
})
export class NotificationsModule {}
