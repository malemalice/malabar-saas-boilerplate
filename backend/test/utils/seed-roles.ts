import { DataSource } from 'typeorm';
import { SeedRoleTable1703664900000 } from '../../src/migrations/1703664900000-SeedRoleTable';

export const seedRoles = async (dataSource: DataSource): Promise<void> => {
  const migration = new SeedRoleTable1703664900000();
  await migration.up(dataSource.createQueryRunner());
};