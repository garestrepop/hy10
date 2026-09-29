import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class FixAgendaForeignKeys1727423000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if tables exist before modifying
    const staffScheduleBlocksExists = await queryRunner.hasTable('staff_schedule_blocks');
    const staffExceptionsExists = await queryRunner.hasTable('staff_exceptions');

    // Fix staff_schedule_blocks foreign key
    if (staffScheduleBlocksExists) {
      const staffScheduleBlocksTable = await queryRunner.getTable('staff_schedule_blocks');
      const oldForeignKey = staffScheduleBlocksTable?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('staff_id') !== -1,
      );
      
      if (oldForeignKey) {
        await queryRunner.dropForeignKey('staff_schedule_blocks', oldForeignKey);
      }

      await queryRunner.createForeignKey(
        'staff_schedule_blocks',
        new TableForeignKey({
          columnNames: ['staff_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }

    // Fix staff_exceptions foreign key
    if (staffExceptionsExists) {
      const staffExceptionsTable = await queryRunner.getTable('staff_exceptions');
      const oldForeignKey = staffExceptionsTable?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('staff_id') !== -1,
      );
      
      if (oldForeignKey) {
        await queryRunner.dropForeignKey('staff_exceptions', oldForeignKey);
      }

      await queryRunner.createForeignKey(
        'staff_exceptions',
        new TableForeignKey({
          columnNames: ['staff_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'users',
          onDelete: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to accounts (if needed for rollback)
    const staffScheduleBlocksExists = await queryRunner.hasTable('staff_schedule_blocks');
    const staffExceptionsExists = await queryRunner.hasTable('staff_exceptions');

    if (staffScheduleBlocksExists) {
      const staffScheduleBlocksTable = await queryRunner.getTable('staff_schedule_blocks');
      const foreignKey = staffScheduleBlocksTable?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('staff_id') !== -1,
      );
      
      if (foreignKey) {
        await queryRunner.dropForeignKey('staff_schedule_blocks', foreignKey);
      }

      await queryRunner.createForeignKey(
        'staff_schedule_blocks',
        new TableForeignKey({
          columnNames: ['staff_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'accounts',
          onDelete: 'CASCADE',
        }),
      );
    }

    if (staffExceptionsExists) {
      const staffExceptionsTable = await queryRunner.getTable('staff_exceptions');
      const foreignKey = staffExceptionsTable?.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('staff_id') !== -1,
      );
      
      if (foreignKey) {
        await queryRunner.dropForeignKey('staff_exceptions', foreignKey);
      }

      await queryRunner.createForeignKey(
        'staff_exceptions',
        new TableForeignKey({
          columnNames: ['staff_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'accounts',
          onDelete: 'CASCADE',
        }),
      );
    }
  }
}
