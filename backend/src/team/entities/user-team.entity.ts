import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../user/user.entity';
import { Team } from '../team.entity';
import { UserTeamStatus } from '../enums/user-team-status.enum';

@Entity('user_teams')
export class UserTeam {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'userId' })
    userId: string;

    @Column({ name: 'teamId' })
    teamId: string;

    @Column({
        type: 'enum',
        enum: UserTeamStatus,
        default: UserTeamStatus.INVITING,
    })
    status: UserTeamStatus;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @ManyToOne(() => Team, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'teamId' })
    team: Team;

    @CreateDateColumn()
    createdAt: Date;
}