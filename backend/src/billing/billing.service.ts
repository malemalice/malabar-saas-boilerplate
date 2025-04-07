import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Plan, BillingCycle } from './entities/plan.entity';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { TeamService } from '../team/team.service';

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
        private teamService: TeamService,
        private dataSource: DataSource,
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

    async createSubscription(teamId: string, planId: number): Promise<Subscription> {
        const team = await this.teamService.findById(teamId);
        if (!team) throw new NotFoundException('Team not found');

        const plan = await this.getPlan(planId);
        
        const startDate = new Date();
        const endDate = new Date();
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

        return this.subscriptionRepository.save(subscription);
    }

    async createInvoice(subscriptionId: number): Promise<Invoice> {
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

    async processPayment(invoiceId: number, paymentData: Partial<Payment>): Promise<Payment> {
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
        return this.subscriptionRepository.findOne({
            where: { teamId, status: SubscriptionStatus.ACTIVE },
            relations: ['plan'],
        });
    }

    async getTeamInvoices(teamId: string): Promise<Invoice[]> {
        return this.invoiceRepository.find({
            where: { teamId },
            relations: ['subscription', 'payments'],
            order: { createdAt: 'DESC' },
        });
    }
}