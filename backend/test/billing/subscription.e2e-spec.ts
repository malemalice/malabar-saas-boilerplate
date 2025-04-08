import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { app } from '../setup';
import { BillingService } from '../../src/billing/billing.service';
import { Plan } from '../../src/billing/entities/plan.entity';
import { Subscription } from '../../src/billing/entities/subscription.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { seedPlans } from '../utils/seed-plans';
import { User } from '../../src/user/user.entity';
import { Team } from '../../src/team/team.entity';
import { RoleType } from '../../src/role/role.entity';
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
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
    await seedRoles(dataSource);
    await seedPlans(dataSource);

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
      const nonExistentTeamId = 'non-existent-team-id';

      const response = await request(app.getHttpServer())
        .post('/billing/subscriptions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          teamId: nonExistentTeamId,
          planId: testPlan.id,
          paymentMethod: 'stripe'
        });

      expect(response.status).toBe(500);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});