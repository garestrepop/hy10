import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Service } from './service.entity';

@Entity('staff_services')
@Index(['staff_id', 'service_id'], { unique: true })
export class StaffService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  staff_id: string;

  @Column()
  service_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  staff: User;

  @ManyToOne(() => Service, service => service.staff_services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'service_id' })
  service: Service;

  @CreateDateColumn()
  created_at: Date;
}
