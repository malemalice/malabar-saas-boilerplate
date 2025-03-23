import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTeamsTable1689924000009 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'teams',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'ownerId',
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

        // Add foreign key for owner
        await queryRunner.createForeignKey(
            'teams',
            new TableForeignKey({
                columnNames: ['ownerId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('teams');
        if (table) {
            const foreignKeys = table.foreignKeys;
            await Promise.all(
                foreignKeys.map((foreignKey) =>
                    queryRunner.dropForeignKey('teams', foreignKey)
                )
            );
        }
        await queryRunner.dropTable('teams');
    }
}