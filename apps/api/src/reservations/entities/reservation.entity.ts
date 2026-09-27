import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReservationStatus {
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show',
}

@Entity({ schema: 'reservations', name: 'reservations' })
@Index(['staff_id', 'start_time'])
@Index(['client_id', 'status'])
@Index(['status', 'start_time'])
export class Reservation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  client_id: string;

  @Column({ type: 'uuid' })
  @Index()
  staff_id: string;

  @Column({ type: 'uuid' })
  service_id: string;

  @Column({ type: 'timestamptz' })
  start_time: Date;

  @Column({ type: 'int' })
  duration_minutes: number;

  @Column({
    type: 'enum',
    enum: ReservationStatus,
    default: ReservationStatus.CONFIRMED,
  })
  status: ReservationStatus;

  @Column({ type: 'int', default: 0 })
  reschedule_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  previous_start_time: Date;

  @Column({ type: 'text', nullable: true })
  cancellation_reason: string;

  @Column({ type: 'uuid', nullable: true })
  cancelled_by_user_id: string;

  @Column({ type: 'uuid', nullable: true })
  rescheduled_by_user_id: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
