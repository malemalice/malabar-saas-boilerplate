import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { Invoice } from './invoice.entity';

export enum PaymentStatus {
    SUCCESSFUL = 'successful',
    FAILED = 'failed',
}

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'invoice_id' })
    invoiceId: number;

    @ManyToOne(() => Invoice, invoice => invoice.payments)
    invoice: Invoice;

    @Column({ name: 'payment_method', length: 50 })
    paymentMethod: string;

    @Column({ name: 'transaction_id' })
    transactionId: string;

    @Column('decimal', { name: 'amount_paid', precision: 10, scale: 2 })
    amountPaid: number;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
    })
    status: PaymentStatus;

    @CreateDateColumn({ name: 'paid_at', nullable: true })
    paidAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}