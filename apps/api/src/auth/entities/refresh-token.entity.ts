import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ unique: true })
  @Index()
  token: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ default: false })
  is_revoked: boolean;

  @Column({ nullable: true })
  device_info: string | null;

  @Column({ nullable: true })
  ip_address: string | null;

  @CreateDateColumn()
  created_at: Date;
}
