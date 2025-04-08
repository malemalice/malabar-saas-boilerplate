import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './invoice.entity';

export enum PaymentStatus {
    SUCCESSFUL = 'successful',
    FAILED = 'failed',
}

@Entity('payments')
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'invoice_id' })
    invoiceId: string;

    @ManyToOne(() => Invoice, invoice => invoice.payments)
    @JoinColumn({ name: 'invoice_id' }) // Ajoutez cette ligne pour la relation ManyToOne avec Invoice
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