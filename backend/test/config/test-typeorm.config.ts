import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { config } from 'dotenv';

// Load the main .env file if environment variables aren't already set
if (!process.env.DB_HOST) {
  config();
}

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST_TEST', configService.get('DB_HOST')),
  port: configService.get('DB_PORT_TEST', configService.get('DB_PORT')),
  username: configService.get('DB_USERNAME_TEST', configService.get('DB_USERNAME')),
  password: configService.get('DB_PASSWORD_TEST', configService.get('DB_PASSWORD')),
  database: configService.get('DB_DATABASE_TEST', configService.get('DB_DATABASE')),
  entities: [join(__dirname, '../../src/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../../src/migrations/*{.ts,.js}')],
  synchronize: true, // Enable synchronize for test environment only
  dropSchema: true, // Drop schema before each test run
});