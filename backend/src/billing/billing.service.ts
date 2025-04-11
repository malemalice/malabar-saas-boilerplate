import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Plan, BillingCycle } from './entities/plan.entity';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { TeamService } from '../team/team.service';
import { StripeConfig } from '../config/stripe.config';
import Stripe from 'stripe';
import { UsageCounter } from './entities/usage-counter.entity';

@Injectable()
export class BillingService {
    constructor(
        @InjectRepository(Plan)
        private planRepository: Repository<Plan>,
        @InjectRepository(Subscription)
        private subscriptionRepository: Repository<Subscription>,
        @InjectRepository(Invoice)
        private invoiceRepository: Repository<Invoice>,
        @InjectRepository(Payment)
        private paymentRepository: Repository<Payment>,
        @InjectRepository(UsageCounter)
        private usageCounterRepository: Repository<UsageCounter>,
        private teamService: TeamService,
        private dataSource: DataSource,
        private configService: ConfigService,
        private stripeConfig: StripeConfig,
    ) {}

    async createPlan(planData: Partial<Plan>): Promise<Plan> {
        const plan = this.planRepository.create(planData);
        return this.planRepository.save(plan);
    }

    async getPlan(id: number): Promise<Plan> {
        const plan = await this.planRepository.findOne({ where: { id } });
        if (!plan) throw new NotFoundException('Plan not found');
        return plan;
    }

    async getAllPlans(): Promise<Plan[]> {
        return this.planRepository.find();
    }

    async createSubscription(teamId: string, planId: number, paymentMethod: string): Promise<{ subscription: Subscription; checkoutUrl: string }> {
        const team = await this.teamService.findById(teamId);
        if (!team) throw new NotFoundException('Team not found');

        const plan = await this.getPlan(planId);
        
        // Find existing subscription with latest end date for the same team and plan
        const existingSubscription = await this.subscriptionRepository.findOne({
            where: {
                teamId,
                planId,
                status: SubscriptionStatus.ACTIVE,
            },
            order: { endDate: 'DESC' }
        });

        const startDate = existingSubscription ? new Date(existingSubscription.endDate) : new Date();
        const endDate = new Date(startDate);
        if (plan.billingCycle === BillingCycle.MONTHLY) {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        const subscription = this.subscriptionRepository.create({
            teamId,
            planId,
            startDate,
            endDate,
            status: SubscriptionStatus.PENDING,
        });

        const savedSubscription = await this.subscriptionRepository.save(subscription);
        const invoice = await this.createInvoice(savedSubscription.id);

        // Create or get Stripe customer
        const stripe = this.stripeConfig.getStripe();
        let customer = await stripe.customers.search({
            query: `metadata['teamId']:'${teamId}'`,
        }).then(result => result.data[0]);

        if (!customer) {
            customer = await stripe.customers.create({
                metadata: { teamId },
            });
        }

        // Create Stripe checkout session
        const session = await this.stripeConfig.createCheckoutSession({
            priceId: plan.stripePriceId,
            customerId: customer.id,
            successUrl: `${this.configService.get('FRONTEND_URL')}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${this.configService.get('FRONTEND_URL')}/billing/cancel`,
            metadata: {
                subscriptionId: String(savedSubscription.id),
                invoiceId: String(invoice.id),
                teamId,
            },
        });

        return {
            subscription: savedSubscription,
            checkoutUrl: session.url,
        };
    }

    async createInvoice(subscriptionId: string): Promise<Invoice> {
        const subscription = await this.subscriptionRepository.findOne({
            where: { id: subscriptionId },
            relations: ['plan'],
        });
        if (!subscription) throw new NotFoundException('Subscription not found');

        const issuedDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

        const invoice = this.invoiceRepository.create({
            teamId: subscription.teamId,
            subscriptionId,
            amount: subscription.plan.price,
            status: InvoiceStatus.UNPAID,
            issuedDate,
            dueDate,
        });

        return this.invoiceRepository.save(invoice);
    }

    async handleStripeWebhook(payload: Buffer, signature: string): Promise<void> {
        const event = await this.stripeConfig.handleWebhookEvent(payload, signature);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const { subscriptionId, invoiceId } = session.metadata;

            await this.processPayment(invoiceId, {
                amountPaid: session.amount_total / 100,
                paymentMethod: 'stripe',
                transactionId: session.payment_intent as string
            });
        }
    }

    private async processPayment(invoiceId: string, paymentData: Partial<Payment>): Promise<Payment> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const invoice = await this.invoiceRepository.findOne({
                where: { id: invoiceId },
                relations: ['subscription'],
            });
            if (!invoice) throw new NotFoundException('Invoice not found');
            if (invoice.status === InvoiceStatus.PAID) {
                throw new BadRequestException('Invoice is already paid');
            }

            const payment = this.paymentRepository.create({
                ...paymentData,
                invoiceId,
                status: PaymentStatus.SUCCESSFUL,
                paidAt: new Date(),
            });

            await queryRunner.manager.save(payment);

            invoice.status = InvoiceStatus.PAID;
            await queryRunner.manager.save(invoice);

            const subscription = invoice.subscription;
            subscription.status = SubscriptionStatus.ACTIVE;
            await queryRunner.manager.save(subscription);

            await queryRunner.commitTransaction();
            return payment;
        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async getTeamSubscription(teamId: string): Promise<Subscription> {
        const currentDate = new Date();
        const activeSubscription = await this.subscriptionRepository.findOne({
            where: {
                teamId,
                status: SubscriptionStatus.ACTIVE,
                startDate: LessThanOrEqual(currentDate),
                endDate: MoreThanOrEqual(currentDate)
            },
            relations: ['plan'],
        });

        if (!activeSubscription) {
            // Get the free plan
            const freePlan = await this.planRepository.findOne({
                where: { name: 'Free' }
            });
            
            // Create a virtual subscription with the free plan
            const virtualSubscription = new Subscription();
            virtualSubscription.teamId = teamId;
            virtualSubscription.plan = freePlan;
            virtualSubscription.status = SubscriptionStatus.ACTIVE;
            virtualSubscription.startDate = new Date();
            virtualSubscription.endDate = new Date(8640000000000000); // Set to max date
            
            return virtualSubscription;
        }

        return activeSubscription;
    }

    async getTeamInvoices(teamId: string, options: { page: number; limit: number }): Promise<{ items: Invoice[]; total: number; page: number; limit: number }> {
        const skip = (options.page - 1) * options.limit;

        const [items, total] = await this.invoiceRepository.findAndCount({
            where: { teamId },
            relations: ['subscription', 'payments','subscription.plan'],
            order: { createdAt: 'DESC' },
            skip,
            take: options.limit
        });

        return {
            items,
            total,
            page: options.page,
            limit: options.limit
        };
    }

    async initializeUsageCounter(teamId: string): Promise<UsageCounter> {
        const existingCounter = await this.usageCounterRepository.findOne({
            where: { teamId }
        });

        if (existingCounter) {
            return existingCounter;
        }

        // Get the team's active subscription and plan
        const subscription = await this.getTeamSubscription(teamId);
        
        const features = {};
        if (subscription.plan.features) {
            subscription.plan.features.forEach(feature => {
                features[feature.metric] = {
                    label: feature.label,
                    value: feature.value,
                    usage: 0
                };
            });
        }

        const counter = this.usageCounterRepository.create({
            teamId,
            features,
            last_reset_date: new Date()
        });

        return this.usageCounterRepository.save(counter);
    }

    async updateUsageCounter(teamId: string, feature: string, value: number): Promise<UsageCounter> {
        const counter = await this.usageCounterRepository.findOne({
            where: { teamId }
        });

        if (!counter) {
            throw new NotFoundException('Usage counter not found for team');
        }

        counter.features = {
            ...counter.features,
            [feature]: (counter.features[feature] || 0) + value
        };

        return this.usageCounterRepository.save(counter);
    }

    async resetUsageCounter(teamId: string): Promise<UsageCounter> {
        const counter = await this.usageCounterRepository.findOne({
            where: { teamId }
        });

        if (!counter) {
            throw new NotFoundException('Usage counter not found for team');
        }

        counter.features = {};
        counter.last_reset_date = new Date();

        return this.usageCounterRepository.save(counter);
    }

    async getUsageCounter(teamId: string): Promise<UsageCounter> {
        const counter = await this.usageCounterRepository.findOne({
            where: { teamId }
        });

        if (!counter) {
            throw new NotFoundException('Usage counter not found for team');
        }

        return counter;
    }
}