import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, ManyToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { VerificationToken } from '../auth/entities/verification-token.entity';
import { Team } from '../team/team.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => VerificationToken, token => token.user)
  verificationTokens: VerificationToken[];

  @ManyToMany(() => Team, team => team.members)
  teams: Team[];
}