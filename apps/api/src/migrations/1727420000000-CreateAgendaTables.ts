import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateAgendaTables1727420000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'schedule_blocks',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'staff_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'day_of_week',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'start_time',
            type: 'time',
            isNullable: false,
          },
          {
            name: 'end_time',
            type: 'time',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'schedule_blocks',
      new TableIndex({
        name: 'IDX_schedule_blocks_staff_id_day',
        columnNames: ['staff_id', 'day_of_week'],
      }),
    );

    await queryRunner.createForeignKey(
      'schedule_blocks',
      new TableForeignKey({
        columnNames: ['staff_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'accounts',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'schedule_exceptions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'staff_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'exception_type',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'exception_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'start_time',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'end_time',
            type: 'time',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'schedule_exceptions',
      new TableIndex({
        name: 'IDX_schedule_exceptions_staff_id_date',
        columnNames: ['staff_id', 'exception_date'],
      }),
    );

    await queryRunner.createForeignKey(
      'schedule_exceptions',
      new TableForeignKey({
        columnNames: ['staff_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'accounts',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const scheduleExceptionTable = await queryRunner.getTable('schedule_exceptions');
    const scheduleExceptionForeignKey = scheduleExceptionTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('staff_id') !== -1,
    );
    if (scheduleExceptionForeignKey) {
      await queryRunner.dropForeignKey('schedule_exceptions', scheduleExceptionForeignKey);
    }

    await queryRunner.dropIndex('schedule_exceptions', 'IDX_schedule_exceptions_staff_id_date');
    await queryRunner.dropTable('schedule_exceptions');

    const scheduleBlockTable = await queryRunner.getTable('schedule_blocks');
    const scheduleBlockForeignKey = scheduleBlockTable?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('staff_id') !== -1,
    );
    if (scheduleBlockForeignKey) {
      await queryRunner.dropForeignKey('schedule_blocks', scheduleBlockForeignKey);
    }

    await queryRunner.dropIndex('schedule_blocks', 'IDX_schedule_blocks_staff_id_day');
    await queryRunner.dropTable('schedule_blocks');
  }
}
