import { MigrationInterface, QueryRunner, Table, TableColumn } from 'typeorm';

export class AddEmailVerification1689924000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    // Create verification_tokens table
    await queryRunner.createTable(
      new Table({
        name: 'verification_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'token',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('verification_tokens');
  }
}