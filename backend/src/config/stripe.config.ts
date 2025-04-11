import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeConfig {
    private stripe: Stripe;

    constructor(private configService: ConfigService) {
        this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY'), {
            apiVersion: '2025-03-31.basil',
        });
    }

    getStripe(): Stripe {
        return this.stripe;
    }

    async createCheckoutSession({
        priceId,
        customerId,
        successUrl,
        cancelUrl,
        metadata,
    }: {
        priceId: string;
        customerId: string;
        successUrl: string;
        cancelUrl: string;
        metadata: Record<string, string>;
    }): Promise<Stripe.Checkout.Session> {
        return this.stripe.checkout.sessions.create({
            mode: 'payment',
            customer: customerId,
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata,
        });
    }

    async handleWebhookEvent(payload: Buffer, signature: string): Promise<Stripe.Event> {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    }
}