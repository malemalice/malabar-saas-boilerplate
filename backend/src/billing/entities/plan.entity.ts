import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Subscription } from './subscription.entity';

export enum BillingCycle {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

@Entity('plans')
export class Plan {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100, nullable:true })
    name: string;

    @Column({type: 'json', nullable: true})
    features: Record<string, any>;


    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price: number;

    @Column({
        type: 'enum',
        enum: BillingCycle,
        default: BillingCycle.MONTHLY,
    })
    billingCycle: BillingCycle;

    @Column({ name: 'stripe_price_id', length: 100, nullable: true })
    stripePriceId: string;

    @Column({ name: 'stripe_product_id', length: 100, nullable: true })
    stripeProductId: string;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    updatedAt: Date;

    @OneToMany(() => Subscription, subscription => subscription.plan)
    subscriptions: Subscription[];
}