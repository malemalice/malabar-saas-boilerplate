import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './team.entity';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class TeamService {
    constructor(
        @InjectRepository(Team)
        private teamRepository: Repository<Team>,
        private userService: UserService,
    ) {}

    async createTeam(name: string, ownerId: string): Promise<Team> {
        const team = this.teamRepository.create({
            name,
            ownerId,
        });
        return this.teamRepository.save(team);
    }

    async findById(id: string): Promise<Team> {
        const team = await this.teamRepository.findOne({
            where: { id },
            relations: ['owner', 'members'],
        });
        if (!team) {
            throw new NotFoundException('Team not found');
        }
        return team;
    }

    async findByOwnerId(ownerId: string): Promise<Team> {
        const team = await this.teamRepository.findOne({
            where: { ownerId },
            relations: ['owner', 'members'],
        });
        if (!team) {
            throw new NotFoundException('Team not found');
        }
        return team;
    }

    async addMember(teamId: string, userId: string): Promise<Team> {
        const [team, user] = await Promise.all([
            this.findById(teamId),
            this.userService.findById(userId),
        ]);

        if (team.members.some(member => member.id === userId)) {
            throw new ConflictException('User is already a member of this team');
        }

        team.members = [...team.members, user];
        return this.teamRepository.save(team);
    }

    async removeMember(teamId: string, userId: string): Promise<Team> {
        const team = await this.findById(teamId);
        
        if (team.ownerId === userId) {
            throw new ConflictException('Cannot remove team owner');
        }

        team.members = team.members.filter(member => member.id !== userId);
        return this.teamRepository.save(team);
    }

    async deleteTeam(teamId: string, userId: string): Promise<void> {
        const team = await this.findById(teamId);
        
        if (team.ownerId !== userId) {
            throw new ConflictException('Only team owner can delete the team');
        }

        await this.teamRepository.remove(team);
    }
}