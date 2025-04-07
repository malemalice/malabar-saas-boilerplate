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

    @Column()
    name: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column({
        type: 'enum',
        enum: BillingCycle,
    })
    billingCycle: BillingCycle;

    @Column('json')
    features: Record<string, any>;

    @OneToMany(() => Subscription, subscription => subscription.plan)
    subscriptions: Subscription[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}