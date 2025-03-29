import { MigrationInterface, QueryRunner } from 'typeorm';
import { RoleType } from '../role/role.entity';

export class SeedRoleTable1703664900000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO roles (id, name, "createdAt") VALUES
            (uuid_generate_v4(), '${RoleType.OWNER}', NOW()),
            (uuid_generate_v4(), '${RoleType.ADMIN}', NOW()),
            (uuid_generate_v4(), '${RoleType.BILLING}', NOW())
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM roles WHERE name IN ('${RoleType.OWNER}', '${RoleType.ADMIN}', '${RoleType.BILLING}')`);
    }
}