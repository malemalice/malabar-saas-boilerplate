import { DataSource } from 'typeorm';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import testDataSource from './config/test-typeorm.config';

export let app: INestApplication;

beforeAll(async () => {
  // Initialize test database
  await testDataSource.initialize();

  // Create test application
  const moduleFixture = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        envFilePath: join(__dirname, 'test.env'),
        isGlobal: true
      }),
      AppModule
    ],
  })
    .overrideProvider(DataSource)
    .useValue(testDataSource)
    .compile();

  app = moduleFixture.createNestApplication();
  await app.init();
});

afterAll(async () => {
  // Close database connection and application
  // Only try to destroy the connection if it's initialized
  if (testDataSource && testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
  if (app) {
    await app.close();
  }
});