import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { app } from '../setup';
import { BillingService } from '../../src/billing/billing.service';
import { BillingCycle, Plan } from '../../src/billing/entities/plan.entity';
import { Subscription, SubscriptionStatus } from '../../src/billing/entities/subscription.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { seedPlans } from '../utils/seed-plans';
import { User } from '../../src/user/entities/user.entity';
import { Team } from '../../src/team/entities/team.entity';
import { seedRoles } from '../utils/seed-roles';

describe('BillingController - Subscriptions (e2e)', () => {
  let billingService: BillingService;
  let dataSource: DataSource;
  let planRepository: Repository<Plan>;
  let userRepository: Repository<User>;
  let teamRepository: Repository<Team>;
  let subscriptionRepository: Repository<Subscription>;
  let ownerUser: User;
  let team: Team;
  let accessToken: string;

  beforeAll(async () => {
    billingService = app.get<BillingService>(BillingService);
    dataSource = app.get(DataSource);
    planRepository = app.get(getRepositoryToken(Plan));
    userRepository = app.get(getRepositoryToken(User));
    teamRepository = app.get(getRepositoryToken(Team));
    subscriptionRepository = app.get(getRepositoryToken(Subscription));
    await dataSource.synchronize(true);
    await seedRoles(dataSource);
    await seedPlans(dataSource);
  });

  beforeEach(async () => {

    // Create owner user
    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'owner@example.com',
        password: 'password123',
        name: 'Team Owner'
      });

    ownerUser = await userRepository.findOne({
      where: { email: 'owner@example.com' }
    });

    // Get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'owner@example.com',
        password: 'password123'
      });

    accessToken = loginResponse.body.accessToken;

    // Get my team
    const teamResponse = await request(app.getHttpServer())
      .get('/teams/my-team')
      .set('Authorization', `Bearer ${accessToken}`);
    team = await teamRepository.findOne({
      where: { id: teamResponse.body.id }
    });
  });

  describe('GET /teams/:teamId/active-plan', () => {
    it('should return active plan for team with active subscription', async () => {
      const plans = await planRepository.find();
      const testPlan = plans[0];
      
      // Create active subscription
      const subscription = await subscriptionRepository.save({
        teamId: team.id,
        planId: testPlan.id,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        status: SubscriptionStatus.ACTIVE,
        plan: testPlan
      });

      const response = await request(app.getHttpServer())
        .get(`/billing/teams/${team.id}/active-plan`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: testPlan.id,
        name: testPlan.name,
        price: testPlan.price,
        billingCycle: testPlan.billingCycle
      });
    });

    it('should return free plan when team has no active subscription', async () => {
      const freePlan = await planRepository.findOne({
        where: { name: 'Free' }
      });

      const response = await request(app.getHttpServer())
        .get(`/billing/teams/${team.id}/active-plan`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: freePlan.id,
        name: freePlan.name,
        price: freePlan.price,
        billingCycle: freePlan.billingCycle
      });
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get(`/billing/teams/${team.id}/active-plan`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /billing/subscriptions', () => {
    it('should create subscription and return checkout URL', async () => {
      const plans = await planRepository.find();
      const testPlan = plans[0];

      const response = await request(app.getHttpServer())
        .post('/billing/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          teamId: team.id,
          planId: testPlan.id,
          paymentMethod: 'stripe'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('subscription');
      expect(response.body).toHaveProperty('checkoutUrl');
      expect(response.body.subscription).toMatchObject({
        teamId: team.id,
        planId: testPlan.id,
      });
      expect(typeof response.body.checkoutUrl).toBe('string');
    });

    it('should set correct dates for new monthly subscription with existing active subscription', async () => {
      const plans = await planRepository.find();
      const testPlan = plans[0];
      
      // Create an existing active subscription
      const existingStartDate = new Date();
      const existingEndDate = new Date(existingStartDate);
      existingEndDate.setMonth(existingEndDate.getMonth() + 1);
      
      const existingSubscription = await subscriptionRepository.save({
        teamId: team.id,
        planId: testPlan.id,
        startDate: existingStartDate,
        endDate: existingEndDate,
        status: SubscriptionStatus.ACTIVE
      });

      const response = await request(app.getHttpServer())
        .post('/billing/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          teamId: team.id,
          planId: testPlan.id,
          paymentMethod: 'stripe'
        });

      expect(response.status).toBe(201);
      expect(response.body.subscription.startDate).toBe(existingEndDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
      const expectedEndDate = new Date(existingEndDate);
      expectedEndDate.setMonth(expectedEndDate.getMonth() + 1);
      expect(response.body.subscription.endDate).toBe(expectedEndDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
    });

    it('should set correct dates for new yearly subscription with existing active subscription', async () => {
      const plans = await planRepository.find();
      const yearlyPlan = await planRepository.save({
        ...plans[0],
        billingCycle: BillingCycle.YEARLY
      });
      
      // Create an existing active subscription
      const existingStartDate = new Date();
      const existingEndDate = new Date(existingStartDate);
      existingEndDate.setFullYear(existingEndDate.getFullYear() + 1);
      
      const existingSubscription = await subscriptionRepository.save({
        teamId: team.id,
        planId: yearlyPlan.id,
        startDate: existingStartDate,
        endDate: existingEndDate,
        status: SubscriptionStatus.ACTIVE
      });

      const response = await request(app.getHttpServer())
        .post('/billing/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          teamId: team.id,
          planId: yearlyPlan.id,
          paymentMethod: 'stripe'
        });

      expect(response.status).toBe(201);
      expect(response.body.subscription.startDate).toBe(existingEndDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
      const expectedEndDate = new Date(existingEndDate);
      expectedEndDate.setFullYear(expectedEndDate.getFullYear() + 1);
      expect(response.body.subscription.endDate).toBe(expectedEndDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
    });

    it('should return 401 when not authenticated', async () => {
      const plans = await planRepository.find();
      const testPlan = plans[0];

      const response = await request(app.getHttpServer())
        .post('/billing/subscriptions')
        .send({
          teamId: team.id,
          planId: testPlan.id,
          paymentMethod: 'stripe'
        });

      expect(response.status).toBe(401);
    });

    it('should return 404 when plan does not exist', async () => {
      const nonExistentPlanId = 9999;

      const response = await request(app.getHttpServer())
        .post('/billing/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          teamId: team.id,
          planId: nonExistentPlanId,
          paymentMethod: 'stripe'
        });

      expect(response.status).toBe(404);
    });

    it('should return 404 when team does not exist', async () => {
      const plans = await planRepository.find();
      const testPlan = plans[0];
      const nonExistentTeamId = '00000000-0000-4000-a000-000000000000';

      const response = await request(app.getHttpServer())
        .post('/billing/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          teamId: nonExistentTeamId,
          planId: testPlan.id,
          paymentMethod: 'stripe'
        });

      expect(response.status).toBe(404);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});