import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from './account.entity';

@Entity('refresh_tokens')
@Index(['token_hash'], { unique: true })
@Index(['account_id', 'is_revoked'])
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  token_hash: string;

  @Column()
  account_id: string;

  @ManyToOne(() => Account, (account) => account.refresh_tokens)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ type: 'timestamptz' })
  expires_at: Date;

  @Column({ default: false })
  is_revoked: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  revoked_at: Date | null;

  @Column({ nullable: true })
  ip_address: string | null;

  @Column({ type: 'text', nullable: true })
  user_agent: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
