import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { StaffService } from './staff-service.entity';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int' })
  duration_minutes: number;

  @Column({ type: 'int', default: 0 })
  price_cents: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'int', nullable: true })
  cancel_window_hours: number | null;

  @Column({ type: 'int', nullable: true })
  reschedule_window_hours: number | null;

  @Column({ type: 'int', nullable: true })
  max_reschedules: number | null;

  @OneToMany(() => StaffService, staffService => staffService.service)
  staff_services: StaffService[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
