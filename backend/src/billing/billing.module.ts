import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { UsageCounter } from './entities/usage-counter.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { TeamModule } from '../team/team.module';
import { StripeConfig } from '../config/stripe.config';

@Module({
    imports: [
        TypeOrmModule.forFeature([Plan, Subscription, Invoice, Payment, UsageCounter]),
        TeamModule,
    ],
    controllers: [BillingController],
    providers: [BillingService, StripeConfig],
    exports: [BillingService],
})
export class BillingModule {}