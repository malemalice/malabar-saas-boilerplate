import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateUserRolesTable1689924000006 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'user_roles',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'userId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'roleId',
                        type: 'uuid',
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

        // Add foreign key for users
        await queryRunner.createForeignKey(
            'user_roles',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            })
        );

        // Add foreign key for roles
        await queryRunner.createForeignKey(
            'user_roles',
            new TableForeignKey({
                columnNames: ['roleId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'roles',
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('user_roles');
        if (table) {
            const foreignKeys = table.foreignKeys;
            await Promise.all(
                foreignKeys.map((foreignKey) =>
                    queryRunner.dropForeignKey('user_roles', foreignKey)
                )
            );
        }
        await queryRunner.dropTable('user_roles');
    }
}