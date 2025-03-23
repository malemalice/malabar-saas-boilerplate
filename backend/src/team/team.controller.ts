import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeamService } from './team.service';
import { CreateTeamDto, AddTeamMemberDto, TeamResponseDto } from './dto/team.dto';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamController {
    constructor(private readonly teamService: TeamService) {}

    @Get('my-team')
    async getMyTeam(@Request() req): Promise<TeamResponseDto> {
        const team = await this.teamService.findByOwnerId(req.user.id);
        return {
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            createdAt: team.createdAt,
            members: team.members.map(member => ({
                id: member.id,
                name: member.name,
                email: member.email,
            })),
        };
    }

    @Post()
    async createTeam(@Request() req, @Body() createTeamDto: CreateTeamDto): Promise<TeamResponseDto> {
        const team = await this.teamService.createTeam(createTeamDto.name, req.user.id);
        return {
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            createdAt: team.createdAt,
            members: team.members?.map(member => ({
                id: member.id,
                name: member.name,
                email: member.email,
            })) || [],
        };
    }

    @Post(':teamId/members')
    async addMember(
        @Request() req,
        @Param('teamId') teamId: string,
        @Body() addMemberDto: AddTeamMemberDto,
    ): Promise<TeamResponseDto> {
        const team = await this.teamService.addMember(teamId, addMemberDto.userId);
        return {
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            createdAt: team.createdAt,
            members: team.members.map(member => ({
                id: member.id,
                name: member.name,
                email: member.email,
            })),
        };
    }

    @Delete(':teamId/members/:userId')
    async removeMember(
        @Request() req,
        @Param('teamId') teamId: string,
        @Param('userId') userId: string,
    ): Promise<void> {
        await this.teamService.removeMember(teamId, userId);
    }

    @Delete(':teamId')
    async deleteTeam(
        @Request() req,
        @Param('teamId') teamId: string,
    ): Promise<void> {
        await this.teamService.deleteTeam(teamId, req.user.id);
    }
}