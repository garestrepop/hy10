import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  // Access
  LOGIN = 'login',
  LOGOUT = 'logout',
  PASSWORD_RESET = 'password_reset',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  
  // Invitations
  STAFF_INVITED = 'staff_invited',
  INVITATION_ACCEPTED = 'invitation_accepted',
  
  // Reservations
  RESERVATION_CREATED = 'reservation_created',
  RESERVATION_CANCELLED = 'reservation_cancelled',
  RESERVATION_RESCHEDULED = 'reservation_rescheduled',
  RESERVATION_COMPLETED = 'reservation_completed',
  RESERVATION_NO_SHOW = 'reservation_no_show',
  
  // Invoices
  INVOICE_ISSUED = 'invoice_issued',
  INVOICE_PAID = 'invoice_paid',
  INVOICE_VOIDED = 'invoice_voided',
  PAYMENT_RECEIVED = 'payment_received',
  
  // Configuration
  SETTINGS_UPDATED = 'settings_updated',
  SERVICE_CREATED = 'service_created',
  SERVICE_UPDATED = 'service_updated',
  SERVICE_DEACTIVATED = 'service_deactivated',
  STAFF_REGISTERED = 'staff_registered',
  STAFF_UPDATED = 'staff_updated',
  STAFF_DEACTIVATED = 'staff_deactivated',
  BUSINESS_HOURS_UPDATED = 'business_hours_updated',
  SCHEDULE_UPDATED = 'schedule_updated',
}

export enum ActorType {
  USER = 'user',
  SYSTEM = 'system',
  WEBHOOK = 'webhook',
}

@Entity('audit_log')
@Index(['action', 'created_at'])
@Index(['actor_type', 'actor_id'])
@Index(['entity_type', 'entity_id'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  @Index()
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: ActorType,
  })
  actor_type: ActorType;

  @Column({ nullable: true })
  actor_id: string;

  @Column({ nullable: true })
  actor_email: string;

  @Column({ nullable: true })
  actor_role: string;

  @Column({ nullable: true })
  entity_type: string;

  @Column({ nullable: true })
  entity_id: string;

  @Column({ type: 'jsonb', nullable: true })
  previous_value: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  new_value: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  metadata: string;

  @Column({ nullable: true })
  ip_address: string;

  @Column({ nullable: true })
  user_agent: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @Column({ default: false })
  is_deleted: boolean;
}
