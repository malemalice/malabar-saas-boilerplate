import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Plan } from './plan.entity';
import { Team } from '../../team/entities/team.entity';
import { Invoice } from './invoice.entity';
import { join } from 'path';

export enum SubscriptionStatus {
    PENDING = 'pending',
    ACTIVE = 'active',
    EXPIRED = 'expired',
    CANCELED = 'canceled',
}

@Entity('subscriptions')
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'team_id' })
    teamId: string;

    @ManyToOne(() => Team, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'team_id' })
    team: Team;

    @Column({ name: 'plan_id' })
    planId: number;

    @ManyToOne(() => Plan, plan => plan.subscriptions)
    @JoinColumn({ name: 'plan_id' })
    plan: Plan;

    @Column({ type: 'date', name: 'start_date' })
    startDate: Date;

    @Column({ type: 'date', name: 'end_date' })
    endDate: Date;

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        default: SubscriptionStatus.PENDING
    })
    status: SubscriptionStatus;

    @OneToMany(() => Invoice, invoice => invoice.subscription)
    invoices: Invoice[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}