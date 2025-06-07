import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { app } from '../setup';
import { BillingService } from '../../src/billing/billing.service';
import { Plan } from '../../src/billing/entities/plan.entity';
import { Subscription, SubscriptionStatus } from '../../src/billing/entities/subscription.entity';
import { Invoice, InvoiceStatus } from '../../src/billing/entities/invoice.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { seedPlans } from '../utils/seed-plans';
import { User } from '../../src/user/entities/user.entity';
import { Team } from '../../src/team/entities/team.entity';
import { seedRoles } from '../utils/seed-roles';

describe('BillingController - Invoices (e2e)', () => {
  let billingService: BillingService;
  let dataSource: DataSource;
  let planRepository: Repository<Plan>;
  let userRepository: Repository<User>;
  let teamRepository: Repository<Team>;
  let subscriptionRepository: Repository<Subscription>;
  let invoiceRepository: Repository<Invoice>;
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
    invoiceRepository = app.get(getRepositoryToken(Invoice));
    await dataSource.synchronize(true);
    await seedRoles(dataSource);
    await seedPlans(dataSource);
  });

  beforeEach(async () => {
    // Clear all existing data
    await invoiceRepository.delete({});
    await subscriptionRepository.delete({});
    await teamRepository.delete({});
    await userRepository.delete({});

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

    // Create test subscription and invoices
    const plans = await planRepository.find();
    const testPlan = plans[0];
    
    const subscription = await subscriptionRepository.save({
      teamId: team.id,
      planId: testPlan.id,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: SubscriptionStatus.ACTIVE,
      plan: testPlan
    });

    // Create multiple test invoices
    const invoices = [];
    for (let i = 0; i < 15; i++) {
      const invoice = await invoiceRepository.save({
        teamId: team.id,
        subscription: subscription,
        amount: testPlan.price,
        status: InvoiceStatus.PAID,
        issuedDate: new Date(new Date().setMonth(new Date().getMonth() - i)),
        createdAt: new Date(new Date().setMonth(new Date().getMonth() - i)),
        dueDate: new Date(new Date().setMonth(new Date().getMonth() - i + 1))
      });
      invoices.push(invoice);
    }
  });

  describe('GET /teams/:teamId/invoices', () => {
    it('should return paginated invoices with default pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/billing/teams/${team.id}/invoices`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(10); // Default limit
      expect(response.body.meta).toMatchObject({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 15,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false
      });

      // Verify invoice structure
      const firstInvoice = response.body.items[0];
      expect(firstInvoice).toHaveProperty('id');
      expect(firstInvoice).toHaveProperty('teamId');
      expect(firstInvoice).toHaveProperty('subscriptionId');
      expect(firstInvoice).toHaveProperty('amount');
      expect(firstInvoice).toHaveProperty('status');
      expect(firstInvoice).toHaveProperty('issuedDate');
      expect(firstInvoice).toHaveProperty('dueDate');
    });

    it('should respect custom pagination parameters', async () => {
      const response = await request(app.getHttpServer())
        .get(`/billing/teams/${team.id}/invoices?page=2&limit=5`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(5);
      expect(response.body.meta).toMatchObject({
        currentPage: 2,
        itemsPerPage: 5,
        totalItems: 15,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true
      });
    });

    it('should handle maximum limit parameter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/billing/teams/${team.id}/invoices?limit=150`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.meta.itemsPerPage).toBe(100); // Should be capped at 100
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get(`/billing/teams/${team.id}/invoices`);

      expect(response.status).toBe(401);
    });

    it('should return empty items array when no invoices exist', async () => {
      // Delete all invoices
      await invoiceRepository.delete({});

      const response = await request(app.getHttpServer())
        .get(`/billing/teams/${team.id}/invoices`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toHaveLength(0);
      expect(response.body.meta).toMatchObject({
        currentPage: 1,
        itemsPerPage: 10,
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      });
    });
  });
});