import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Team } from '../../team/entities/team.entity';
import { Subscription } from './subscription.entity';
import { Payment } from './payment.entity';

export enum InvoiceStatus {
    UNPAID = 'unpaid',
    PAID = 'paid',
    FAILED = 'failed',
}

@Entity('invoices')
export class Invoice {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'team_id' })
    teamId: string;

    @ManyToOne(() => Team, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'team_id' })
    team: Team;

    @Column({ name: 'subscription_id' })
    subscriptionId: string;

    @ManyToOne(() => Subscription, subscription => subscription.invoices)
    @JoinColumn({ name: 'subscription_id' })
    subscription: Subscription;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: 'enum',
        enum: InvoiceStatus,
        default: InvoiceStatus.UNPAID
    })
    status: InvoiceStatus;

    @Column({ type: 'date', name: 'issued_date' })
    issuedDate: Date;

    @Column({ type: 'date', name: 'due_date' })
    dueDate: Date;

    @OneToMany(() => Payment, payment => payment.invoice)
    payments: Payment[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}