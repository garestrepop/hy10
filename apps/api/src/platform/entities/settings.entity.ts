import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity({ schema: 'platform', name: 'settings' })
export class Settings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', default: 'America/Bogota' })
  timezone: string;

  @Column({ type: 'varchar', nullable: true })
  llm_model_id: string;

  @Column({ type: 'int', default: 60 })
  session_ttl_minutes: number;

  @Column({ type: 'int', default: 3 })
  handoff_ambiguity_threshold: number;

  @Column({ type: 'int', default: 30 })
  staff_upcoming_notice_minutes: number;

  @Column({ type: 'int', default: 60 })
  voice_note_max_seconds: number;

  @Column({ type: 'jsonb', nullable: true })
  cancellation_policy: {
    allowed: boolean;
    hours_before?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  reschedule_policy: {
    allowed: boolean;
    hours_before?: number;
    max_reschedules?: number;
  };

  @Column({ type: 'text', nullable: true })
  bot_token_ciphertext: string;

  @Column({ type: 'text', nullable: true })
  bot_token_iv: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
