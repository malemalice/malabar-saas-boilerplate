import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateRolesTable1689924000005 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum type for roles
        await queryRunner.query(`
            CREATE TYPE role_type AS ENUM ('owner', 'admin', 'billing');
        `);

        await queryRunner.createTable(
            new Table({
                name: 'roles',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'role_type',
                        isNullable: false,
                    },
                    {
                        name: 'createdAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('roles');
        await queryRunner.query('DROP TYPE role_type;');
    }
}