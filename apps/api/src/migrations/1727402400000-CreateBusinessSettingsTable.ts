import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateBusinessSettingsTable1727402400000
  implements MigrationInterface
{
  name = 'CreateBusinessSettingsTable1727402400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'business_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'singleton',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'timezone',
            type: 'varchar',
            isNullable: false,
            default: "'America/Bogota'",
          },
          {
            name: 'model_identifier',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'conversation_session_ttl_minutes',
            type: 'int',
            isNullable: false,
            default: 60,
          },
          {
            name: 'handoff_ambiguity_attempts',
            type: 'int',
            isNullable: false,
            default: 3,
          },
          {
            name: 'staff_upcoming_notice_minutes',
            type: 'int',
            isNullable: false,
            default: 30,
          },
          {
            name: 'voice_note_max_seconds',
            type: 'int',
            isNullable: false,
            default: 60,
          },
          {
            name: 'allow_cancel',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'allow_reschedule',
            type: 'boolean',
            isNullable: false,
            default: false,
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
        ],
        indices: [
          {
            name: 'UQ_business_settings_singleton',
            columnNames: ['singleton'],
            isUnique: true,
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('business_settings');
  }
}
