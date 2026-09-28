import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateServicesTable1727415000000 implements MigrationInterface {
  name = 'CreateServicesTable1727415000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'services',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'name',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'duration_minutes',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'price_cents',
            type: 'int',
            isNullable: false,
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'allow_cancel',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'allow_reschedule',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'cancel_min_hours',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'reschedule_min_hours',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'max_reschedules',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'IDX_services_is_active',
            columnNames: ['is_active'],
          },
          {
            name: 'IDX_services_deleted_at',
            columnNames: ['deleted_at'],
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('services');
  }
}
