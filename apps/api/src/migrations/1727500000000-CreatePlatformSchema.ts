import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlatformSchema1727500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS platform`);
    
    await queryRunner.query(`
      CREATE TABLE platform.settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        timezone VARCHAR NOT NULL DEFAULT 'America/Bogota',
        llm_model_id VARCHAR,
        session_ttl_minutes INT NOT NULL DEFAULT 60,
        handoff_ambiguity_threshold INT NOT NULL DEFAULT 3,
        staff_upcoming_notice_minutes INT NOT NULL DEFAULT 30,
        voice_note_max_seconds INT NOT NULL DEFAULT 60,
        cancellation_policy JSONB,
        reschedule_policy JSONB,
        bot_token_ciphertext TEXT,
        bot_token_iv TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE TYPE platform.notification_type AS ENUM (
        'reservation_cancelled',
        'reservation_rescheduled',
        'staff_upcoming',
        'invitation_email',
        'handoff'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE platform.notification_status AS ENUM (
        'pending',
        'sent',
        'failed'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE platform.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type platform.notification_type NOT NULL,
        recipient_id UUID NOT NULL,
        recipient_telegram_id VARCHAR,
        reservation_id UUID,
        message TEXT NOT NULL,
        metadata JSONB,
        status platform.notification_status NOT NULL DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        sent_at TIMESTAMPTZ
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_notifications_recipient_created 
      ON platform.notifications(recipient_id, created_at)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_notifications_status_created 
      ON platform.notifications(status, created_at)
    `);

    await queryRunner.query(`
      INSERT INTO platform.settings (timezone) VALUES ('America/Bogota')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS platform.notifications`);
    await queryRunner.query(`DROP TYPE IF EXISTS platform.notification_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS platform.notification_type`);
    await queryRunner.query(`DROP TABLE IF EXISTS platform.settings`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS platform CASCADE`);
  }
}
