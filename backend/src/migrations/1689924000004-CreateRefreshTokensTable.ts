import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateRefreshTokensTable1689924000004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "refresh_token",
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
                        isNullable: false,
                    },
                    {
                        name: "isRevoked",
                        type: "boolean",
                        default: false,
                        isNullable: false,
                    },
                    {
                        name: "revokedAt",
                        type: "timestamp",
                        isNullable: true,
                    },
                ],
            }),
            true
        );

        await queryRunner.createForeignKey(
            "refresh_token",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("refresh_token");
        if (table) {
            const foreignKey = table.foreignKeys.find(
                (fk) => fk.columnNames.indexOf("userId") !== -1
            );
            if (foreignKey) {
                await queryRunner.dropForeignKey("refresh_token", foreignKey);
            }
        }
        await queryRunner.dropTable("refresh_token");
    }
}