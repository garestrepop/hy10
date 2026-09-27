import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { RefreshToken } from './refresh-token.entity';

export enum AccountRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

@Entity('accounts')
@Index(['email'], { unique: true })
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password_hash: string | null;

  @Column({
    type: 'enum',
    enum: AccountRole,
  })
  role: AccountRole;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  @Column({ nullable: true })
  provider_id: string | null;

  @Column({ default: false })
  mfa_enabled: boolean;

  @Column({ nullable: true })
  mfa_secret: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  last_login_at: Date | null;

  @Column({ nullable: true })
  telegram_user_id: string | null;

  @OneToMany(() => RefreshToken, (token) => token.account)
  refresh_tokens: RefreshToken[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
