import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'int' })
  duration_minutes: number;

  @Column({ type: 'int', default: 0 })
  price_cents: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'boolean', nullable: true })
  allow_cancel: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  allow_reschedule: boolean | null;

  @Column({ type: 'int', nullable: true })
  cancel_min_hours: number | null;

  @Column({ type: 'int', nullable: true })
  reschedule_min_hours: number | null;

  @Column({ type: 'int', nullable: true })
  max_reschedules: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;
}
