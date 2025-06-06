import { Team } from "src/team/entities/team.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";



@Entity('usage_counters')
export class UsageCounter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'team_id' })
    teamId: string;

    @ManyToOne(()=> Team, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'team_id' })
    team: Team;

    @Column({type:'json', nullable: true})
    features: Record<string, any>;

    @Column({type:'date'})
    last_reset_date: Date;
}