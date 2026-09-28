import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateStaffInvitationsTable1727403600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'staff_invitations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
          },
          {
            name: 'token',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'invited_by',
            type: 'uuid',
          },
          {
            name: 'expires_at',
            type: 'timestamp',
          },
          {
            name: 'is_used',
            type: 'boolean',
            default: false,
          },
          {
            name: 'used_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'staff_invitations',
      new TableIndex({
        name: 'IDX_staff_invitations_token',
        columnNames: ['token'],
      }),
    );

    await queryRunner.createIndex(
      'staff_invitations',
      new TableIndex({
        name: 'IDX_staff_invitations_email',
        columnNames: ['email'],
      }),
    );

    await queryRunner.createIndex(
      'staff_invitations',
      new TableIndex({
        name: 'IDX_staff_invitations_invited_by',
        columnNames: ['invited_by'],
      }),
    );

    await queryRunner.createForeignKey(
      'staff_invitations',
      new TableForeignKey({
        columnNames: ['invited_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'staff_invitations',
      new TableForeignKey({
        columnNames: ['created_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('staff_invitations');
  }
}
