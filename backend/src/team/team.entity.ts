import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, CreateDateColumn, JoinColumn, JoinTable } from 'typeorm';
import { User } from '../user/user.entity';
import { UserTeam } from './entities/user-team.entity';

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

    @ManyToMany(() => UserTeam)
    @JoinTable()
    members: UserTeam[];

    @CreateDateColumn()
    createdAt: Date;
}