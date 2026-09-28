import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateServicesAndStaffServicesTables1727420000000
  implements MigrationInterface
{
  name = 'CreateServicesAndStaffServicesTables1727420000000';

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
            isNullable: true,
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
            name: 'cancel_window_hours',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'reschedule_window_hours',
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
        ],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'staff_services',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'staff_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'service_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            isNullable: false,
            default: 'now()',
          },
        ],
      }),
    );

    await queryRunner.createIndex(
      'staff_services',
      new TableIndex({
        name: 'IDX_staff_services_staff_service',
        columnNames: ['staff_id', 'service_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'staff_services',
      new TableForeignKey({
        columnNames: ['staff_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'staff_services',
      new TableForeignKey({
        columnNames: ['service_id'],
        referencedTableName: 'services',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const staffServicesTable = await queryRunner.getTable('staff_services');
    const foreignKeys = staffServicesTable!.foreignKeys;
    for (const fk of foreignKeys) {
      await queryRunner.dropForeignKey('staff_services', fk);
    }
    
    await queryRunner.dropIndex('staff_services', 'IDX_staff_services_staff_service');
    await queryRunner.dropTable('staff_services');
    await queryRunner.dropTable('services');
  }
}
