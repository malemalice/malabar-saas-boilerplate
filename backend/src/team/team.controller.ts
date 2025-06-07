import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeamService } from './team.service';
import { CreateTeamDto, AddTeamMemberDto, TeamResponseDto, InviteTeamMemberDto, TeamInvitationResponseDto } from './dto/team.dto';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';
import { TeamMemberResponseDto } from './dto/team-member-response.dto';
import { RoleType } from 'src/role/entities/role.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('teams')
@Controller('teams')
@ApiBearerAuth()
export class TeamController {
    @ApiOperation({ summary: 'Get invitation details by token' })
    @ApiResponse({ status: 200, description: 'Returns the invitation details', type: TeamInvitationResponseDto })
    @ApiResponse({ status: 404, description: 'Invitation not found' })
    @Get('invitations/:token')
    async getInvitationByToken(@Param('token') token: string): Promise<TeamInvitationResponseDto> {
        const invitation = await this.teamService.findInvitationByToken(token);
        return {
            email: invitation.email,
            teamId: invitation.teamId,
            status: invitation.status,
        };
    }
    constructor(private readonly teamService: TeamService) {}

    @ApiOperation({ summary: 'Get the authenticated user\'s team' })
    @ApiResponse({ status: 200, description: 'Returns the team details', type: TeamResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Team not found' })
    @Get('my-team')
    @UseGuards(JwtAuthGuard)
    async getMyTeam(@Request() req): Promise<TeamResponseDto> {
        const team = await this.teamService.findByOwnerId(req.user.id);
        return {
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            createdAt: team.createdAt,
            members: team.members.map(member => ({
                userId: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.role?.name,
                status: member.status,
            })),
        };
    }

    @ApiOperation({ summary: 'Create a new team' })
    @ApiResponse({ status: 201, description: 'Team created successfully', type: TeamResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @Post()
    @UseGuards(JwtAuthGuard)
    async createTeam(@Request() req, @Body() createTeamDto: CreateTeamDto): Promise<TeamResponseDto> {
        const team = await this.teamService.createTeam(createTeamDto.name, req.user.id);
        return {
            id: team.id,
            name: team.name + " Team",
            ownerId: team.ownerId,
            createdAt: team.createdAt,
            members: team.members?.map(member => ({
                userId: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.role?.name,
                status: member.status,
            })) || [],
        };
    }

    @ApiOperation({ summary: 'Add a member to the team' })
    @ApiResponse({ status: 200, description: 'Member added successfully', type: TeamResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Team or user not found' })
    @ApiResponse({ status: 409, description: 'User is already a member of this team' })
    @Post(':teamId/members')
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(RoleType.OWNER,RoleType.ADMIN)
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
                userId: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.role?.name,
                status: member.status,
            })),
        };
    }

    @ApiOperation({ summary: 'Invite a user to join the team' })
    @ApiResponse({ status: 200, description: 'Invitation sent successfully', type: TeamResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Team not found' })
    @ApiResponse({ status: 409, description: 'User is already invited to this team' })
    @Post(':teamId/invite')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.OWNER,RoleType.ADMIN)
    async inviteMember(
        @Request() req,
        @Param('teamId') teamId: string,
        @Body() inviteDto: InviteTeamMemberDto,
    ): Promise<TeamResponseDto> {
        const result = await this.teamService.inviteMember(teamId, inviteDto.email, req.user.id, inviteDto.role as RoleType);
        const team = await this.teamService.findById(teamId);
        return {
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            createdAt: team.createdAt,
            members: team.members.map(member => ({
                userId: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.role?.name,
                status: member.status,
            })),
        };
    }

    @ApiOperation({ summary: 'Accept a team invitation' })
    @ApiResponse({ status: 200, description: 'Invitation accepted successfully', type: TeamResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Invitation not found' })
    @Post('invitations/:teamId/accept')
    @UseGuards(JwtAuthGuard)
    async acceptInvitation(
        @Request() req,
        @Param('teamId') teamId: string,
    ): Promise<TeamResponseDto> {
        const userTeam = await this.teamService.acceptInvitation(teamId, req.user.id);
        const team = await this.teamService.findById(teamId);
        return {
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            createdAt: team.createdAt,
            members: team.members.map(member => ({
                userId: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.role?.name,
                status: member.status,
            })),
        };
    }

    @ApiOperation({ summary: 'Reject a team invitation' })
    @ApiResponse({ status: 200, description: 'Invitation rejected successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Invitation not found' })
    @Post('invitations/:teamId/reject')
    @UseGuards(JwtAuthGuard)
    async rejectInvitation(
        @Request() req,
        @Param('teamId') teamId: string,
    ): Promise<void> {
        await this.teamService.rejectInvitation(teamId, req.user.id);
    }

    @ApiOperation({ summary: 'Remove a member from the team' })
    @ApiResponse({ status: 200, description: 'Member removed successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Team or member not found' })
    @ApiResponse({ status: 409, description: 'Cannot remove team owner' })
    @Delete(':teamId/members/:userId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.OWNER,RoleType.ADMIN)
    async removeMember(
        @Request() req,
        @Param('teamId') teamId: string,
        @Param('userId') userId: string,
    ): Promise<void> {
        await this.teamService.removeMember(teamId, userId);
    }

    @ApiOperation({ summary: 'Delete a team' })
    @ApiResponse({ status: 200, description: 'Team deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Team not found' })
    @ApiResponse({ status: 409, description: 'Only team owner can delete the team' })
    @Delete(':teamId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.OWNER)
    async deleteTeam(
        @Request() req,
        @Param('teamId') teamId: string,
    ): Promise<void> {
        await this.teamService.deleteTeam(teamId, req.user.id);
    }

    @ApiOperation({ summary: 'Update team member role' })
    @ApiResponse({ status: 200, description: 'Role updated successfully', type: TeamResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Team or member not found' })
    @ApiResponse({ status: 409, description: 'Cannot modify team owner role' })
    @Patch(':teamId/members/:userId/role')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(RoleType.OWNER,RoleType.ADMIN)
    async updateMemberRole(
        @Request() req,
        @Param('teamId') teamId: string,
        @Param('userId') userId: string,
        @Body() updateRoleDto: UpdateTeamMemberRoleDto
    ): Promise<TeamResponseDto> {
        const team = await this.teamService.updateMemberRole(teamId, userId, updateRoleDto.role);
        return {
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            createdAt: team.createdAt,
            members: team.members.map(member => ({
                userId: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.role?.name,
                status: member.status,
            })),
        };
    }

    @ApiOperation({ summary: 'Get teams where user is a member' })
    @ApiResponse({ status: 200, description: 'Returns the list of teams', type: [TeamResponseDto] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @Get('joined')
    @UseGuards(JwtAuthGuard)
    async getJoinedTeams(@Request() req): Promise<TeamResponseDto[]> {
        const teams = await this.teamService.findTeamsByMemberId(req.user.id);
        return teams.map(team => ({
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            createdAt: team.createdAt,
            members: team.members.map(member => {
                return {
                    userId: member.user.id,
                    name: member.user.name,
                    email: member.user.email,
                    role: member?.role?.name,
                    status: member?.status,
                };
            })
        }));
    }
    @ApiOperation({ summary: 'Get team details by ID' })
    @ApiResponse({ status: 200, description: 'Returns the team details', type: TeamResponseDto })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - User is not a member of this team' })
    @ApiResponse({ status: 404, description: 'Team not found' })
    @Get(':teamId')
    @UseGuards(JwtAuthGuard)
    async getTeamById(
        @Request() req,
        @Param('teamId') teamId: string
    ): Promise<TeamResponseDto> {
        const team = await this.teamService.findTeamByIdAndUserId(teamId, req.user.id);
        return {
            id: team.id,
            name: team.name,
            ownerId: team.ownerId,
            createdAt: team.createdAt,
            members: team.members.map(member => ({
                userId: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.role?.name,
                status: member.status,
            })),
        };
    }
}