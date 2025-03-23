import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStatusToUserTeams1689924000011 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'user_teams',
            new TableColumn({
                name: 'status',
                type: 'enum',
                enum: ['inviting', 'reject', 'active'],
                default: '\'inviting\'',
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('user_teams', 'status');
    }
}