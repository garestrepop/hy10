import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateBusinessHoursTable1727425000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'business_hours',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'day_of_week',
            type: 'int',
            isNullable: false,
            comment: 'Day of week (0=Sunday, 6=Saturday)',
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
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'business_hours',
      new TableIndex({
        name: 'IDX_business_hours_day_of_week',
        columnNames: ['day_of_week'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('business_hours', 'IDX_business_hours_day_of_week');
    await queryRunner.dropTable('business_hours');
  }
}
