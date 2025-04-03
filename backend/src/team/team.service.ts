import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import * as crypto from 'crypto';
import { Team } from './team.entity';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { UserTeam } from './entities/user-team.entity';
import { UserTeamStatus } from './enums/user-team-status.enum';
import { TeamInvitation } from './entities/team-invitation.entity';
import { TeamInvitationStatus } from './entities/team-invitation.entity';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { RoleType } from 'src/role/role.entity';
import { RoleService } from 'src/role/role.service';

@Injectable()
export class TeamService {
    async findInvitationByToken(token: string) {
        const invitation = await this.teamInvitationRepository.findOne({
            where: {
                token,
                status: TeamInvitationStatus.PENDING,
            },
        });
        if (!invitation) {
            throw new NotFoundException('Invitation not found or expired');
        }
        return invitation;
    }
    constructor(
        @InjectRepository(Team)
        private teamRepository: Repository<Team>,
        @InjectRepository(UserTeam)
        private userTeamRepository: Repository<UserTeam>,
        @InjectRepository(TeamInvitation)
        private teamInvitationRepository: Repository<TeamInvitation>,
        private userService: UserService,
        private roleService: RoleService,
        private mailerService: MailerService,
        private configService: ConfigService,
    ) {}

    async createTeam(name: string, ownerId: string): Promise<Team> {
        const team = this.teamRepository.create({
            name,
            ownerId,
        });
        const savedTeam = await this.teamRepository.save(team);
        
        // Remove console.log
        const ownerRole = await this.roleService.findByName(RoleType.OWNER);
        
        // Make sure ownerRole exists and has an id
        if (!ownerRole || !ownerRole.id) {
            throw new Error('Owner role not found');
        }
    
        const userTeam = this.userTeamRepository.create({
            teamId: savedTeam.id,
            userId: ownerId,
            roleId: ownerRole.id,  // Make sure this is set
            status: UserTeamStatus.ACTIVE,
        });
        await this.userTeamRepository.save(userTeam);
        
        return savedTeam;
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

    async addMember(teamId: string, userId: string, roleName: RoleType = RoleType.BILLING): Promise<Team> {
        const [team, user, role] = await Promise.all([
            this.findById(teamId),
            this.userService.findById(userId),
            this.roleService.findByName(roleName),
        ]);

        if (team.members.some(member => member.id === userId)) {
            throw new ConflictException('User is already a member of this team');
        }

        const userTeam = this.userTeamRepository.create({
            teamId,
            userId,
            roleId: role.id,
            status: UserTeamStatus.ACTIVE,
        });
        await this.userTeamRepository.save(userTeam);

        team.members = [...team.members, user];
        return this.teamRepository.save(team);
    }

    async inviteMember(teamId: string, email: string, inviterId: string, roleName: RoleType = RoleType.ADMIN): Promise<UserTeam | TeamInvitation> {
        const [team, inviter, role] = await Promise.all([
            this.findById(teamId),
            this.userService.findById(inviterId),
            this.roleService.findByName(roleName)
        ]);
        let user = await this.userService.findByEmail(email).catch(() => null);
        
        if (user) {
            // Check for existing invitation for registered users
            const existingUserTeam = await this.userTeamRepository.findOne({
                where: {
                    teamId,
                    userId: user.id,
                    status: UserTeamStatus.INVITING,
                },
            });

            if (existingUserTeam) {
                throw new ConflictException('User is already invited to this team');
            }
        } else {
            // Check for existing invitation for non-registered users
            const existingInvitation = await this.teamInvitationRepository.findOne({
                where: {
                    teamId,
                    email,
                    status: TeamInvitationStatus.PENDING,
                },
            });

            if (existingInvitation) {
                throw new ConflictException('This email is already invited to this team');
            }
        }

        const frontendUrl = this.configService.get('FRONTEND_URL');

        if (user) {
            // For existing users, create a UserTeam record
            const userTeam = this.userTeamRepository.create({
                teamId,
                userId: user.id,
                roleId: role.id,
                status: UserTeamStatus.INVITING,
            });
            await this.userTeamRepository.save(userTeam);

            // Send invitation email for existing user
            await this.mailerService.sendMail({
                to: email,
                subject: `Team Invitation from ${inviter.name}`,
                template: './team-invitation',
                context: {
                    inviterName: inviter.name,
                    isExistingUser: true,
                    acceptUrl: `${frontendUrl}/teams/invitations/accept?teamId=${teamId}&userId=${user.id}`,
                    rejectUrl: `${frontendUrl}/teams/invitations/reject?teamId=${teamId}&userId=${user.id}`
                },
            });

            return userTeam;
        } else {
            // For non-existing users, create a TeamInvitation record
            const token = crypto.randomBytes(32).toString('hex');
            const teamInvitation = this.teamInvitationRepository.create({
                teamId,
                inviterId,
                email,
                token,
                roleId: role.id,
                status: TeamInvitationStatus.PENDING,
            });
            await this.teamInvitationRepository.save(teamInvitation);

            // Send invitation email for non-existing user
            await this.mailerService.sendMail({
                to: email,
                subject: `Join Invitation from ${inviter.name}`,
                template: './team-invitation',
                context: {
                    inviterName: inviter.name,
                    isExistingUser: false,
                    signupUrl: `${frontendUrl}/signup?token=${token}`
                },
            });

            return teamInvitation;
        }
    }

    async acceptInvitation(teamId: string, userId: string, token?: string): Promise<UserTeam> {
        const memberRole = await this.roleService.findByName(RoleType.BILLING);

        if (token) {
            // Handle token-based invitation for non-existing users
            const invitation = await this.teamInvitationRepository.findOne({
                where: {
                    teamId,
                    token,
                    status: TeamInvitationStatus.PENDING,
                },
            });

            if (!invitation) {
                throw new NotFoundException('Invitation not found or expired');
            }

            // Create new UserTeam record
            const userTeam = this.userTeamRepository.create({
                teamId,
                userId,
                roleId: memberRole.id,
                status: UserTeamStatus.ACTIVE,
            });

            // Update invitation status
            invitation.status = TeamInvitationStatus.ACCEPTED;
            invitation.acceptedAt = new Date();
            await this.teamInvitationRepository.save(invitation);

            return this.userTeamRepository.save(userTeam);
        }

        // Handle existing user invitation
        const userTeam = await this.userTeamRepository.findOne({
            where: {
                teamId,
                userId,
                status: UserTeamStatus.INVITING,
            },
        });

        if (!userTeam) {
            throw new NotFoundException('Invitation not found');
        }

        userTeam.status = UserTeamStatus.ACTIVE;
        userTeam.roleId = memberRole.id;
        return this.userTeamRepository.save(userTeam);
    }

    async rejectInvitation(teamId: string, userId: string, token?: string): Promise<UserTeam | TeamInvitation> {
        if (token) {
            // Handle token-based invitation rejection
            const invitation = await this.teamInvitationRepository.findOne({
                where: {
                    teamId,
                    token,
                    status: TeamInvitationStatus.PENDING,
                },
            });

            if (!invitation) {
                throw new NotFoundException('Invitation not found or expired');
            }

            invitation.status = TeamInvitationStatus.EXPIRED;
            return this.teamInvitationRepository.save(invitation);
        }

        // Handle existing user invitation rejection
        const userTeam = await this.userTeamRepository.findOne({
            where: {
                teamId,
                userId,
                status: UserTeamStatus.INVITING,
            },
        });

        if (!userTeam) {
            throw new NotFoundException('Invitation not found');
        }

        userTeam.status = UserTeamStatus.REJECT;
        return this.userTeamRepository.save(userTeam);
    }

    async cleanupExpiredInvitations(): Promise<void> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        await this.teamInvitationRepository.update(
            {
                status: TeamInvitationStatus.PENDING,
                sentAt: LessThan(thirtyDaysAgo),
            },
            { status: TeamInvitationStatus.EXPIRED }
        );
    }

    async removeMember(teamId: string, userId: string): Promise<void> {
        const team = await this.findById(teamId);
        
        if (team.ownerId === userId) {
            throw new ConflictException('Cannot remove team owner');
        }

        await this.userTeamRepository.delete({
            teamId,
            userId,
        });
    }

    async findTeamsByMemberId(userId: string): Promise<Team[]> {
        const userTeams = await this.userTeamRepository.find({
            where: {
                userId,
                status: UserTeamStatus.ACTIVE,
            },
            relations: ['team', 'team.members'],
        });

        return userTeams.map(ut => ut.team);
    }

    async deleteTeam(teamId: string, userId: string): Promise<void> {
        const team = await this.findById(teamId);
        
        if (team.ownerId !== userId) {
            throw new ConflictException('Only team owner can delete the team');
        }

        await this.teamRepository.remove(team);
    }
}