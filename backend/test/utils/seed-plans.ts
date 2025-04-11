import { DataSource } from "typeorm";
import { SeedTablePlan1744016964455 } from "src/migrations/1744016964455-SeedTablePlan";

export const seedPlans = async (dataSource: DataSource): Promise<void> => {
  const migration = new SeedTablePlan1744016964455();
  await migration.up(dataSource.createQueryRunner());
};