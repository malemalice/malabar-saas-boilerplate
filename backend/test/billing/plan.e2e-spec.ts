import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { app } from '../setup';
import { BillingService } from '../../src/billing/billing.service';
import { Plan, BillingCycle } from '../../src/billing/entities/plan.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { seedPlans } from '../utils/seed-plans';

describe('BillingController - getAllPlans (e2e)', () => {
  let billingService: BillingService;
  let dataSource: DataSource;
  let planRepository: Repository<Plan>;

  beforeAll(async () => {
    billingService = app.get<BillingService>(BillingService);
    dataSource = app.get(DataSource);
    planRepository = app.get(getRepositoryToken(Plan));
    await dataSource.synchronize(true);
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
    await seedPlans(dataSource);
  });

  describe('GET /billing/plans', () => {
    it('should return all available plans', async () => {
      const response = await request(app.getHttpServer())
        .get('/billing/plans');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      
      // Verify plan details
      expect(response.body[0]).toMatchObject({
        name: 'Free',
        price: "0.00",
        billingCycle: 'monthly'
      });

      expect(response.body[1]).toMatchObject({
        name: 'Premium',
        price: "29.99",
        billingCycle: 'monthly'
      });

      expect(response.body[2]).toMatchObject({
        name: 'Enterprise',
        price: "99.99",
        billingCycle: 'monthly'
      });
    });

    it('should return empty array when no plans exist', async () => {
      // Delete all plans
      await planRepository.delete({});

      const response = await request(app.getHttpServer())
        .get('/billing/plans');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(0);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});