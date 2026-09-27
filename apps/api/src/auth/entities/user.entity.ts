import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
}

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ nullable: true })
  password_hash: string | null;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.EMAIL,
  })
  auth_provider: AuthProvider;

  @Column({ nullable: true })
  google_id: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  role: UserRole;

  @Column({ nullable: true })
  first_name: string | null;

  @Column({ nullable: true })
  last_name: string | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ nullable: true })
  mfa_secret: string | null;

  @Column({ default: false })
  mfa_enabled: boolean;

  @Column({ nullable: true })
  telegram_user_id: string | null;

  @Column({ default: 0 })
  failed_login_attempts: number;

  @Column({ type: 'timestamp', nullable: true })
  last_failed_login: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  locked_until: Date | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
