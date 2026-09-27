import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAccessSchema1727500100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS access`);

    await queryRunner.query(`
      CREATE TYPE access.user_role AS ENUM ('admin', 'staff')
    `);

    await queryRunner.query(`
      CREATE TABLE access.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR NOT NULL UNIQUE,
        password_hash VARCHAR,
        role access.user_role NOT NULL DEFAULT 'staff',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        telegram_user_id VARCHAR UNIQUE,
        display_name VARCHAR,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_users_email ON access.users(email)
    `);

    await queryRunner.query(`
      CREATE INDEX idx_users_telegram ON access.users(telegram_user_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS access.users`);
    await queryRunner.query(`DROP TYPE IF EXISTS access.user_role`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS access CASCADE`);
  }
}
