import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateRolePermissionsTable1689924000008 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'role_permissions',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'roleId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'permissionId',
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

        // Add foreign key for roles
        await queryRunner.createForeignKey(
            'role_permissions',
            new TableForeignKey({
                columnNames: ['roleId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'roles',
                onDelete: 'CASCADE',
            })
        );

        // Add foreign key for permissions
        await queryRunner.createForeignKey(
            'role_permissions',
            new TableForeignKey({
                columnNames: ['permissionId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'permissions',
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('role_permissions');
        if (table) {
            const foreignKeys = table.foreignKeys;
            await Promise.all(
                foreignKeys.map((foreignKey) =>
                    queryRunner.dropForeignKey('role_permissions', foreignKey)
                )
            );
        }
        await queryRunner.dropTable('role_permissions');
    }
}