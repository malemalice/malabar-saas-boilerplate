import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class AddPasswordResetRateLimit1689924000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "password_reset_rate_limit",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "email",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "attemptCount",
                        type: "integer",
                        default: 1,
                        isNullable: false,
                    },
                    {
                        name: "lastAttempt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        isNullable: false,
                    },
                    {
                        name: "nextAllowedAttempt",
                        type: "timestamp",
                        isNullable: false,
                    },
                ],
            }),
            true
        );

        await queryRunner.createIndex(
            "password_reset_rate_limit",
            new TableIndex({
                name: "IDX_PASSWORD_RESET_RATE_LIMIT_EMAIL",
                columnNames: ["email"],
                isUnique: true,
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex("password_reset_rate_limit", "IDX_PASSWORD_RESET_RATE_LIMIT_EMAIL");
        await queryRunner.dropTable("password_reset_rate_limit");
    }
}