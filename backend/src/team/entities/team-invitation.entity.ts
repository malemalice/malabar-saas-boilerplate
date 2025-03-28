import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Team } from '../team.entity';
import { User } from '../../user/user.entity';

export enum TeamInvitationStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    EXPIRED = 'expired',
}

@Entity('team_invitations')
export class TeamInvitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'team_id' })
    teamId: string;

    @ManyToOne(() => Team, { onDelete: 'CASCADE' })
    team: Team;

    @Column({ name: 'inviter_id' })
    inviterId: string;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    inviter: User;

    @Column({ unique: true })
    email: string;

    @Column({
        type: 'enum',
        enum: TeamInvitationStatus,
        default: TeamInvitationStatus.PENDING,
    })
    status: TeamInvitationStatus;

    @Column({ unique: true })
    token: string;

    @CreateDateColumn({ name: 'sent_at' })
    sentAt: Date;

    @Column({ name: 'accepted_at', nullable: true })
    acceptedAt: Date;
}