import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateAuditLogTable1727398800000 implements MigrationInterface {
  name = 'CreateAuditLogTable1727398800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create audit_log table
    await queryRunner.createTable(
      new Table({
        name: 'audit_log',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'action',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'actor_type',
            type: 'varchar',
            isNullable: false,
          },
          {
            name: 'actor_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'actor_email',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'actor_role',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'entity_type',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'entity_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'previous_value',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'new_value',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'is_deleted',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes for efficient querying
    await queryRunner.createIndex(
      'audit_log',
      new TableIndex({
        name: 'idx_audit_action',
        columnNames: ['action'],
      }),
    );

    await queryRunner.createIndex(
      'audit_log',
      new TableIndex({
        name: 'idx_audit_action_created',
        columnNames: ['action', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'audit_log',
      new TableIndex({
        name: 'idx_audit_actor',
        columnNames: ['actor_type', 'actor_id'],
      }),
    );

    await queryRunner.createIndex(
      'audit_log',
      new TableIndex({
        name: 'idx_audit_entity',
        columnNames: ['entity_type', 'entity_id'],
      }),
    );

    await queryRunner.createIndex(
      'audit_log',
      new TableIndex({
        name: 'idx_audit_created_at',
        columnNames: ['created_at'],
      }),
    );

    // Add comment to table for documentation
    await queryRunner.query(`
      COMMENT ON TABLE audit_log IS 'Append-only audit log for critical operations per FR-56, NFR-07, NFR-16';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN audit_log.previous_value IS 'Previous state before change, sensitive fields redacted';
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN audit_log.new_value IS 'New state after change, sensitive fields redacted';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('audit_log', 'idx_audit_created_at');
    await queryRunner.dropIndex('audit_log', 'idx_audit_entity');
    await queryRunner.dropIndex('audit_log', 'idx_audit_actor');
    await queryRunner.dropIndex('audit_log', 'idx_audit_action_created');
    await queryRunner.dropIndex('audit_log', 'idx_audit_action');

    // Drop table
    await queryRunner.dropTable('audit_log');
  }
}
