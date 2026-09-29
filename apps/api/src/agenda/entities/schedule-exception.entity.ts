import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from '../../access/entities/account.entity';

export enum ExceptionType {
  BLOCK = 'block',
  OPENING = 'opening',
}

@Entity('schedule_exceptions')
@Index(['staff_id', 'exception_date'])
export class ScheduleException {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  staff_id: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'staff_id' })
  staff: Account;

  @Column({
    type: 'enum',
    enum: ExceptionType,
  })
  exception_type: ExceptionType;

  @Column({ type: 'date' })
  exception_date: string;

  @Column({ type: 'time', nullable: true })
  start_time: string | null;

  @Column({ type: 'time', nullable: true })
  end_time: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
