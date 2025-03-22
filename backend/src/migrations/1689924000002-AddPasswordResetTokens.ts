import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class AddPasswordResetTokens1689924000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "password_reset_token",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "token",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "userId",
                        type: "uuid",
                        isNullable: false,
                    },
                    {
                        name: "expiresAt",
                        type: "timestamp",
                        isNullable: false,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );

        await queryRunner.createIndex(
            "password_reset_token",
            new TableIndex({
                name: "IDX_PASSWORD_RESET_TOKEN",
                columnNames: ["token"],
                isUnique: true,
            })
        );

        await queryRunner.createForeignKey(
            "password_reset_token",
            new TableForeignKey({
                name: "FK_PASSWORD_RESET_USER",
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropForeignKey("password_reset_token", "FK_PASSWORD_RESET_USER");
        await queryRunner.dropIndex("password_reset_token", "IDX_PASSWORD_RESET_TOKEN");
        await queryRunner.dropTable("password_reset_token");
    }
}