import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { app } from '../setup';
import { BillingService } from '../../src/billing/billing.service';
import { Plan, BillingCycle } from '../../src/billing/entities/plan.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { seedPlans } from '../utils/seed-plans';

describe('BillingController - Plans (e2e)', () => {
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

  describe('GET /billing/plans/:id', () => {
    it('should return a specific plan by ID', async () => {
      const plans = await planRepository.find();
      const testPlan = plans[0];

      const response = await request(app.getHttpServer())
        .get(`/billing/plans/${testPlan.id}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: testPlan.id,
        name: testPlan.name,
        price: testPlan.price,
        billingCycle: testPlan.billingCycle
      });
    });

    it('should return 404 when plan does not exist', async () => {
      const nonExistentId = 9999;

      const response = await request(app.getHttpServer())
        .get(`/billing/plans/${nonExistentId}`);

      expect(response.status).toBe(404);
    });
  });
});