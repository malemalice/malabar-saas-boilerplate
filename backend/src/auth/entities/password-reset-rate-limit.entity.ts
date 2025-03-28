import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('password_reset_rate_limits')
export class PasswordResetRateLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  attemptCount: number;

  @CreateDateColumn()
  lastAttempt: Date;

  @Column()
  nextAllowedAttempt: Date;
}