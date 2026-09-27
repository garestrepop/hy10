import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateAuthTables1727410000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'staff'],
          },
          {
            name: 'provider',
            type: 'enum',
            enum: ['local', 'google'],
            default: "'local'",
          },
          {
            name: 'provider_id',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'mfa_enabled',
            type: 'boolean',
            default: false,
          },
          {
            name: 'mfa_secret',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'last_login_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'telegram_user_id',
            type: 'varchar',
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
      'accounts',
      new TableIndex({
        name: 'IDX_accounts_email',
        columnNames: ['email'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'refresh_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'token',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'account_id',
            type: 'uuid',
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
          },
          {
            name: 'is_revoked',
            type: 'boolean',
            default: false,
          },
          {
            name: 'revoked_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'ip_address',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_tokens_token',
        columnNames: ['token'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'refresh_tokens',
      new TableIndex({
        name: 'IDX_refresh_tokens_account_revoked',
        columnNames: ['account_id', 'is_revoked'],
      }),
    );

    await queryRunner.createForeignKey(
      'refresh_tokens',
      new TableForeignKey({
        columnNames: ['account_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'accounts',
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('refresh_tokens');
    const foreignKey = table.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('account_id') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('refresh_tokens', foreignKey);
    }

    await queryRunner.dropTable('refresh_tokens');
    await queryRunner.dropTable('accounts');
  }
}
