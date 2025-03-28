import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../user/user.entity';
import { Team } from '../team.entity';
import { Role } from '../../role/role.entity';
import { UserTeamStatus } from '../enums/user-team-status.enum';

@Entity('user_teams')
export class UserTeam {
    @PrimaryColumn('uuid')
    userId: string;

    @PrimaryColumn('uuid')
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

    @Column({ type: 'uuid', nullable: true }) // Temporarily make it nullable
    roleId: string;

    @ManyToOne(() => Role, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'roleId' })
    role: Role;

    @CreateDateColumn()
    createdAt: Date;
}