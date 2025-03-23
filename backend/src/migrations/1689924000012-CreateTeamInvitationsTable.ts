import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateTeamInvitationsTable1689924000012 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'team_invitations',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'teamId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'inviterId',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'token',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'status',
                        type: 'enum',
                        enum: ['pending', 'accepted', 'expired'],
                        default: '\'pending\'',
                    },
                    {
                        name: 'sentAt',
                        type: 'timestamp',
                        default: 'CURRENT_TIMESTAMP',
                    },
                    {
                        name: 'acceptedAt',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true
        );

        // Add foreign key for team
        await queryRunner.createForeignKey(
            'team_invitations',
            new TableForeignKey({
                columnNames: ['teamId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'teams',
                onDelete: 'CASCADE',
            })
        );

        // Add foreign key for inviter
        await queryRunner.createForeignKey(
            'team_invitations',
            new TableForeignKey({
                columnNames: ['inviterId'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            })
        );

        // Add unique constraint for team and email combination
        await queryRunner.createIndex(
            'team_invitations',
            new TableIndex(
                {
                    name: 'IDX_TEAM_EMAIL_UNIQUE',
                    columnNames: ['teamId', 'email'],
                    isUnique: true,
                }
            )
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('team_invitations');
        if (table) {
            const foreignKeys = table.foreignKeys;
            await Promise.all(
                foreignKeys.map(foreignKey =>
                    queryRunner.dropForeignKey('team_invitations', foreignKey)
                )
            );
            await queryRunner.dropTable('team_invitations');
        }
    }
}