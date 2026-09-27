import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReservationsSchema1727500200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS reservations`);

    await queryRunner.query(`
      CREATE TABLE reservations.clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        telegram_user_id VARCHAR NOT NULL UNIQUE,
        display_name VARCHAR NOT NULL,
        opted_out BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_clients_telegram ON reservations.clients(telegram_user_id)
    `);

    await queryRunner.query(`
      CREATE TYPE reservations.reservation_status AS ENUM (
        'confirmed',
        'cancelled',
        'completed',
        'no_show'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE reservations.reservations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL,
        staff_id UUID NOT NULL,
        service_id UUID NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        duration_minutes INT NOT NULL,
        status reservations.reservation_status NOT NULL DEFAULT 'confirmed',
        reschedule_count INT NOT NULL DEFAULT 0,
        previous_start_time TIMESTAMPTZ,
        cancellation_reason TEXT,
        cancelled_by_user_id UUID,
        rescheduled_by_user_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reservations_client ON reservations.reservations(client_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reservations_staff ON reservations.reservations(staff_id)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reservations_staff_time 
      ON reservations.reservations(staff_id, start_time)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reservations_client_status 
      ON reservations.reservations(client_id, status)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_reservations_status_time 
      ON reservations.reservations(status, start_time)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS reservations.reservations`);
    await queryRunner.query(`DROP TYPE IF EXISTS reservations.reservation_status`);
    await queryRunner.query(`DROP TABLE IF EXISTS reservations.clients`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS reservations CASCADE`);
  }
}
