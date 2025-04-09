import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { app } from '../setup';
import { BillingService } from '../../src/billing/billing.service';
import { Plan } from '../../src/billing/entities/plan.entity';
import { Subscription, SubscriptionStatus } from '../../src/billing/entities/subscription.entity';
import { Invoice, InvoiceStatus } from '../../src/billing/entities/invoice.entity';
import { Payment, PaymentStatus } from '../../src/billing/entities/payment.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { seedPlans } from '../utils/seed-plans';
import { User } from '../../src/user/user.entity';
import { Team } from '../../src/team/team.entity';
import { seedRoles } from '../utils/seed-roles';
import { StripeConfig } from 'src/config/stripe.config';

describe('BillingService - Payment Processing (e2e)', () => {
  let billingService: BillingService;
  let dataSource: DataSource;
  let planRepository: Repository<Plan>;
  let userRepository: Repository<User>;
  let teamRepository: Repository<Team>;
  let subscriptionRepository: Repository<Subscription>;
  let invoiceRepository: Repository<Invoice>;
  let paymentRepository: Repository<Payment>;
  let stripeConfig: StripeConfig;
  let ownerUser: User;
  let team: Team;
  let subscription: Subscription;
  let invoice: Invoice;

  beforeAll(async () => {
    billingService = app.get<BillingService>(BillingService);
    dataSource = app.get(DataSource);
    planRepository = app.get(getRepositoryToken(Plan));
    userRepository = app.get(getRepositoryToken(User));
    teamRepository = app.get(getRepositoryToken(Team));
    subscriptionRepository = app.get(getRepositoryToken(Subscription));
    invoiceRepository = app.get(getRepositoryToken(Invoice));
    paymentRepository = app.get(getRepositoryToken(Payment));
    stripeConfig = app.get<StripeConfig>(StripeConfig);
    await dataSource.synchronize(true);
  });

  beforeEach(async () => {
    // Mock Stripe webhook event construction
    jest.spyOn(stripeConfig, 'handleWebhookEvent').mockImplementation(async (payload) => {
      return JSON.parse(payload.toString()) as any;
    });
    await dataSource.synchronize(true);
    await seedRoles(dataSource);
    await seedPlans(dataSource);

    // Create owner user
    ownerUser = userRepository.create({
      email: 'owner@example.com',
      password: 'password123',
      name: 'Team Owner'
    });
    await userRepository.save(ownerUser);

    // Create team
    team = teamRepository.create({
      name: 'Test Team',
      ownerId: ownerUser.id
    });
    await teamRepository.save(team);

    // Create subscription
    const plan = await planRepository.findOne({ where: { name: 'Premium' } });
    subscription = subscriptionRepository.create({
      teamId: team.id,
      planId: plan.id,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      status: SubscriptionStatus.PENDING
    });
    await subscriptionRepository.save(subscription);

    // Create invoice
    invoice = invoiceRepository.create({
      teamId: team.id,
      subscriptionId: subscription.id,
      amount: plan.price,
      status: InvoiceStatus.UNPAID,
      issuedDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7))
    });
    await invoiceRepository.save(invoice);
  });

  describe('processPayment', () => {
    it('should process payment successfully and update statuses', async () => {
      const paymentData = {
        amountPaid: 29.99,
        paymentMethod: 'stripe',
        transactionId: 'pi_test_123'
      };

      await billingService.handleStripeWebhook(
        Buffer.from(JSON.stringify({
          type: 'checkout.session.completed',
          data: {
            object: {
              metadata: {
                subscriptionId: subscription.id,
                invoiceId: invoice.id
              },
              amount_total: 2999,
              payment_intent: 'pi_test_123'
            }
          }
        })),
        'test_signature'
      );

      // Verify payment was created
      const payment = await paymentRepository.findOne({
        where: { invoiceId: invoice.id }
      });
      expect(payment).toBeDefined();
      expect(payment.status).toBe(PaymentStatus.SUCCESSFUL);
      expect(payment.transactionId).toBe(paymentData.transactionId);

      // Verify invoice status was updated
      const updatedInvoice = await invoiceRepository.findOne({
        where: { id: invoice.id }
      });
      expect(updatedInvoice.status).toBe(InvoiceStatus.PAID);

      // Verify subscription status was updated
      const updatedSubscription = await subscriptionRepository.findOne({
        where: { id: subscription.id }
      });
      expect(updatedSubscription.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should throw error when invoice does not exist', async () => {
      const nonExistentInvoiceId = '00000000-0000-4000-a000-000000000000';

      await expect(
        billingService.handleStripeWebhook(
          Buffer.from(JSON.stringify({
            type: 'checkout.session.completed',
            data: {
              object: {
                metadata: {
                  subscriptionId: subscription.id,
                  invoiceId: nonExistentInvoiceId
                },
                amount_total: 2999,
                payment_intent: 'pi_test_123'
              }
            }
          })),
          'test_signature'
        )
      ).rejects.toThrow('Invoice not found');
    });

    it('should throw error when invoice is already paid', async () => {
      // First payment
      await billingService.handleStripeWebhook(
        Buffer.from(JSON.stringify({
          type: 'checkout.session.completed',
          data: {
            object: {
              metadata: {
                subscriptionId: subscription.id,
                invoiceId: invoice.id
              },
              amount_total: 2999,
              payment_intent: 'pi_test_123'
            }
          }
        })),
        'test_signature'
      );

      // Attempt second payment
      await expect(
        billingService.handleStripeWebhook(
          Buffer.from(JSON.stringify({
            type: 'checkout.session.completed',
            data: {
              object: {
                metadata: {
                  subscriptionId: subscription.id,
                  invoiceId: invoice.id
                },
                amount_total: 2999,
                payment_intent: 'pi_test_456'
              }
            }
          })),
          'test_signature'
        )
      ).rejects.toThrow('Invoice is already paid');
    });
  });

  afterAll(async () => {
    await app.close();
  });
});