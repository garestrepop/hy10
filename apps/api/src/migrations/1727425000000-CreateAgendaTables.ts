import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgendaTables1727425000000 implements MigrationInterface {
  name = 'CreateAgendaTables1727425000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "business_hours" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "day_of_week" integer NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "staff_schedule_blocks" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "staff_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "day_of_week" integer NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_staff_schedule_blocks_staff_day" 
      ON "staff_schedule_blocks" ("staff_id", "day_of_week")
    `);

    await queryRunner.query(`
      CREATE TYPE "staff_exceptions_type_enum" AS ENUM('block', 'opening')
    `);

    await queryRunner.query(`
      CREATE TABLE "staff_exceptions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "staff_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "date" date NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "type" "staff_exceptions_type_enum" NOT NULL,
        "reason" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_staff_exceptions_staff_date" 
      ON "staff_exceptions" ("staff_id", "date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_staff_exceptions_staff_date"`);
    await queryRunner.query(`DROP TABLE "staff_exceptions"`);
    await queryRunner.query(`DROP TYPE "staff_exceptions_type_enum"`);
    await queryRunner.query(`DROP INDEX "IDX_staff_schedule_blocks_staff_day"`);
    await queryRunner.query(`DROP TABLE "staff_schedule_blocks"`);
    await queryRunner.query(`DROP TABLE "business_hours"`);
  }
}
