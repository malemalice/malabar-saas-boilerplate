import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateUserTeamsTable1689924000010 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'user_teams',
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
                        name: 'teamId',
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
            'user_teams',
            new TableForeignKey({
                columnNames: ['userId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            })
        );

        // Add foreign key for teams
        await queryRunner.createForeignKey(
            'user_teams',
            new TableForeignKey({
                columnNames: ['teamId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'teams',
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('user_teams');
        if (table) {
            const foreignKeys = table.foreignKeys;
            await Promise.all(
                foreignKeys.map((foreignKey) =>
                    queryRunner.dropForeignKey('user_teams', foreignKey)
                )
            );
        }
        await queryRunner.dropTable('user_teams');
    }
}