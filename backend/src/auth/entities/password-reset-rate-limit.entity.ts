import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
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