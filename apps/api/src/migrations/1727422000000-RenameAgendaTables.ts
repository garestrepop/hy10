import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameAgendaTables1727422000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename schedule_blocks to staff_schedule_blocks
    await queryRunner.query(
      `ALTER TABLE IF EXISTS schedule_blocks RENAME TO staff_schedule_blocks`,
    );

    // Rename schedule_exceptions to staff_exceptions
    await queryRunner.query(
      `ALTER TABLE IF EXISTS schedule_exceptions RENAME TO staff_exceptions`,
    );

    // Rename indexes
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_schedule_blocks_staff_id_day" RENAME TO "IDX_staff_schedule_blocks_staff_id_day"`,
    );

    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_schedule_exceptions_staff_id_date" RENAME TO "IDX_staff_exceptions_staff_id_date"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert table names
    await queryRunner.query(
      `ALTER TABLE IF EXISTS staff_schedule_blocks RENAME TO schedule_blocks`,
    );

    await queryRunner.query(
      `ALTER TABLE IF EXISTS staff_exceptions RENAME TO schedule_exceptions`,
    );

    // Revert index names
    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_staff_schedule_blocks_staff_id_day" RENAME TO "IDX_schedule_blocks_staff_id_day"`,
    );

    await queryRunner.query(
      `ALTER INDEX IF EXISTS "IDX_staff_exceptions_staff_id_date" RENAME TO "IDX_schedule_exceptions_staff_id_date"`,
    );
  }
}
