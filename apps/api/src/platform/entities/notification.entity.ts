import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum NotificationType {
  RESERVATION_CANCELLED = 'reservation_cancelled',
  RESERVATION_RESCHEDULED = 'reservation_rescheduled',
  STAFF_UPCOMING = 'staff_upcoming',
  INVITATION_EMAIL = 'invitation_email',
  HANDOFF = 'handoff',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

@Entity({ schema: 'platform', name: 'notifications' })
@Index(['recipient_id', 'created_at'])
@Index(['status', 'created_at'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'uuid' })
  @Index()
  recipient_id: string;

  @Column({ type: 'varchar', nullable: true })
  recipient_telegram_id: string;

  @Column({ type: 'uuid', nullable: true })
  reservation_id: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    previous_start_time?: string;
    new_start_time?: string;
    service_name?: string;
    client_name?: string;
    [key: string]: any;
  };

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: true })
  sent_at: Date;
}
