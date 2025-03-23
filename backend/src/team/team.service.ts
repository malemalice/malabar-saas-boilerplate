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

@Injectable()
export class TeamService {
    constructor(
        @InjectRepository(Team)
        private teamRepository: Repository<Team>,
        @InjectRepository(UserTeam)
        private userTeamRepository: Repository<UserTeam>,
        @InjectRepository(TeamInvitation)
        private teamInvitationRepository: Repository<TeamInvitation>,
        private userService: UserService,
        private mailerService: MailerService,
        private configService: ConfigService,
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

    async inviteMember(teamId: string, email: string, inviterId: string): Promise<UserTeam | TeamInvitation> {
        const [team, inviter] = await Promise.all([
            this.findById(teamId),
            this.userService.findById(inviterId)
        ]);
        let user = await this.userService.findByEmail(email).catch(() => null);

        // Check for existing invitation
        const existingInvite = await this.userTeamRepository.findOne({
            where: {
                teamId,
                ...(user ? { userId: user.id } : {}),
                status: UserTeamStatus.INVITING,
            },
        });

        if (existingInvite) {
            throw new ConflictException('User is already invited to this team');
        }

        const frontendUrl = this.configService.get('FRONTEND_URL');

        if (user) {
            // For existing users, create a UserTeam record
            const userTeam = this.userTeamRepository.create({
                teamId,
                userId: user.id,
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
                status: TeamInvitationStatus.PENDING,
            });
            await this.teamInvitationRepository.save(teamInvitation);

            // Send invitation email for non-existing user
            await this.mailerService.sendMail({
                to: email,
                subject: `Team Invitation from ${inviter.name}`,
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

    async deleteTeam(teamId: string, userId: string): Promise<void> {
        const team = await this.findById(teamId);
        
        if (team.ownerId !== userId) {
            throw new ConflictException('Only team owner can delete the team');
        }

        await this.teamRepository.remove(team);
    }
}