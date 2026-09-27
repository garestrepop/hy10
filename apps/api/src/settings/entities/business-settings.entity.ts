import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('business_settings')
export class BusinessSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: true, unique: true })
  singleton: boolean;

  @Column({ default: 'America/Bogota' })
  timezone: string;

  @Column({ type: 'varchar', nullable: true })
  model_identifier: string | null;

  @Column({ type: 'int', default: 60 })
  conversation_session_ttl_minutes: number;

  @Column({ type: 'int', default: 3 })
  handoff_ambiguity_attempts: number;

  @Column({ type: 'int', default: 30 })
  staff_upcoming_notice_minutes: number;

  @Column({ type: 'int', default: 60 })
  voice_note_max_seconds: number;

  @Column({ default: false })
  allow_cancel: boolean;

  @Column({ default: false })
  allow_reschedule: boolean;

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
}
