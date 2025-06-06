import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, JoinColumn, JoinTable } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { UserTeam } from './user-team.entity';

@Entity('teams')
export class Team {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ name: 'ownerId' })
    ownerId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'ownerId' })
    owner: User;

    @OneToMany(() => UserTeam, userTeam => userTeam.team)
    members: UserTeam[];

    @CreateDateColumn()
    createdAt: Date;
} 