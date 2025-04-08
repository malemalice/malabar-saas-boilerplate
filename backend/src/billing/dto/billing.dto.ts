import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '../entities/plan.entity';
import { Subscription } from '../entities/subscription.entity';
import { Invoice } from '../entities/invoice.entity';
import { Payment } from '../entities/payment.entity';

export class PlanResponseDto {
    @ApiProperty({ description: 'Plan ID' })
    id: number;

    @ApiProperty({ description: 'Plan name' })
    name: string;

    @ApiProperty({ description: 'Plan description' })
    description: string;

    @ApiProperty({ description: 'Plan price' })
    price: number;

    @ApiProperty({ description: 'Billing cycle (MONTHLY/YEARLY)' })
    billingCycle: string;
}

export class SubscriptionResponseDto {
    @ApiProperty({ description: 'Subscription ID' })
    id: number;

    @ApiProperty({ description: 'Team ID' })
    teamId: string;

    @ApiProperty({ description: 'Plan ID' })
    planId: number;

    @ApiProperty({ description: 'Subscription start date' })
    startDate: Date;

    @ApiProperty({ description: 'Subscription end date' })
    endDate: Date;

    @ApiProperty({ description: 'Subscription status' })
    status: string;
}

export class CreateSubscriptionDto {
    @ApiProperty({ description: 'Team ID' })
    teamId: string;

    @ApiProperty({ description: 'Plan ID' })
    planId: number;

    @ApiProperty({ description: 'Payment method (stripe)' })
    paymentMethod: string;
}

export class SubscriptionWithCheckoutDto extends SubscriptionResponseDto {
    @ApiProperty({ description: 'Stripe checkout URL' })
    checkoutUrl: string;
}

export class InvoiceResponseDto {
    @ApiProperty({ description: 'Invoice ID' })
    id: number;

    @ApiProperty({ description: 'Team ID' })
    teamId: string;

    @ApiProperty({ description: 'Subscription ID' })
    subscriptionId: number;

    @ApiProperty({ description: 'Invoice amount' })
    amount: number;

    @ApiProperty({ description: 'Invoice status' })
    status: string;

    @ApiProperty({ description: 'Invoice issued date' })
    issuedDate: Date;

    @ApiProperty({ description: 'Invoice due date' })
    dueDate: Date;
}

export class PaymentResponseDto {
    @ApiProperty({ description: 'Payment ID' })
    id: number;

    @ApiProperty({ description: 'Invoice ID' })
    invoiceId: number;

    @ApiProperty({ description: 'Payment amount' })
    amount: number;

    @ApiProperty({ description: 'Payment status' })
    status: string;

    @ApiProperty({ description: 'Payment date' })
    paidAt: Date;
}

export class ProcessPaymentDto {
    @ApiProperty({ description: 'Payment amount' })
    amount: number;

    @ApiProperty({ description: 'Payment method' })
    paymentMethod: string;

    @ApiProperty({ description: 'Stripe session ID', required: false })
    stripeSessionId?: string;
}