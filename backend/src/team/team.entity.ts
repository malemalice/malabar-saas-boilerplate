import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, CreateDateColumn, JoinColumn, JoinTable } from 'typeorm';
import { User } from '../user/user.entity';

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

    @ManyToMany(() => User)
    @JoinTable({
        name: 'user_teams',
        joinColumn: {
            name: 'teamId',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'userId',
            referencedColumnName: 'id'
        }
    })
    members: User[];

    @CreateDateColumn()
    createdAt: Date;
}