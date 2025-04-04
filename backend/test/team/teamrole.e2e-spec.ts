import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from '../../src/auth/auth.service';
import { TeamService } from '../../src/team/team.service';
import { RoleType } from '../../src/role/role.entity';
import { Repository, DataSource } from 'typeorm';
import { app } from '../setup';
import { seedRoles } from '../utils/seed-roles';
import { UserTeamStatus } from 'src/team/enums/user-team-status.enum';
import { UserTeam } from 'src/team/entities/user-team.entity';

describe('TeamController (e2e)', () => {
  let authService: AuthService;
  let teamService: TeamService;
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let team1Id: string;
  let team2Id: string;
  let dataSource: DataSource;
  let userTeamRepository: Repository<UserTeam>;

  beforeAll(async () => {
    authService = app.get<AuthService>(AuthService);
    teamService = app.get<TeamService>(TeamService);
    dataSource = app.get(DataSource);
    userTeamRepository = app.get(getRepositoryToken(UserTeam));
    await dataSource.synchronize(true);
    await seedRoles(dataSource);

    // Create test users
    const user1 = await authService.signup('user1@test.com', 'password123', 'User One');
    const user2 = await authService.signup('user2@test.com', 'password123', 'User Two');
    user1Id = user1.user.id;
    user2Id = user2.user.id;

    // Login users
    const loginUser1 = await authService.login('user1@test.com', 'password123');
    const loginUser2 = await authService.login('user2@test.com', 'password123');
    user1Token = loginUser1.accessToken;
    user2Token = loginUser2.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Team Membership Scenarios', () => {
    beforeEach(async () => {
      // Get teams created during signup
      const team1Response = await request(app.getHttpServer())
        .get('/teams/my-team')
        .set('Authorization', `Bearer ${user1Token}`);
      team1Id = team1Response.body.id;

      const team2Response = await request(app.getHttpServer())
        .get('/teams/my-team')
        .set('Authorization', `Bearer ${user2Token}`);
      team2Id = team2Response.body.id;

      // User2 invites User1 to their team as billing member
      const inviteResponse = await request(app.getHttpServer())
        .post(`/teams/${team2Id}/invite`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          email: 'user1@test.com',
          role: RoleType.BILLING
        });

      expect(inviteResponse.status).toBe(201);

      // User1 accepts invitation to User2's team
      const acceptInviteResponse = await request(app.getHttpServer())
        .post(`/teams/invitations/${team2Id}/accept`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(acceptInviteResponse.status).toBe(201);
    });

    it('should verify User1 is owner of Team1', async () => {
      const response = await request(app.getHttpServer())
        .get('/teams/my-team')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.ownerId).toBe(user1Id);
      expect(response.body.id).toBe(team1Id);
    });

    it('should verify User1 is a billing member of Team2', async () => {
      const response = await request(app.getHttpServer())
        .get('/teams/joined')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      const team2 = response.body.find(team => team.id === team2Id);
      expect(team2).toBeDefined();
      expect(team2.ownerId).toBe(user2Id);

      // Verify User1's member information in Team2
      const user1Member = team2.members.find(m => m.userId === user1Id);
      expect(user1Member).toBeDefined();
      expect(user1Member.role).toBe(RoleType.BILLING);
      expect(user1Member.email).toBe('user1@test.com');
      expect(user1Member.name).toBe('User One');

      // Verify database record
      const userTeam = await userTeamRepository.findOne({
        where: {
          userId: user1Id,
          teamId: team2Id,
          status: UserTeamStatus.ACTIVE
        },
        relations: ['role']
      });
      expect(userTeam).toBeDefined();
      expect(userTeam.role.name).toBe(RoleType.BILLING);
    });

    it('should verify User1 can access both teams', async () => {
      // Check access to Team1 (owned team)
      const team1Response = await request(app.getHttpServer())
        .get('/teams/my-team')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(team1Response.status).toBe(200);
      expect(team1Response.body.id).toBe(team1Id);

      // Verify owner member information
      expect(team1Response.body.ownerId).toBe(user1Id)

      // Check access to Team2 (billing member)
      const joinedTeamsResponse = await request(app.getHttpServer())
        .get('/teams/joined')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(joinedTeamsResponse.status).toBe(200);
      const team2 = joinedTeamsResponse.body.find(team => team.id === team2Id);
      expect(team2).toBeDefined();

      // Verify billing member information
      const billingMember = team2.members.find(m => m.userId === user1Id);
      expect(billingMember).toBeDefined();
      expect(billingMember.role).toBe(RoleType.BILLING);
    });

    describe('Team Member Role Update Scenarios', () => {
      it('should allow team owner to update member role from billing to admin', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/teams/${team2Id}/members/${user1Id}/role`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({ role: RoleType.ADMIN });
        expect(response.status).toBe(200);
        expect(response.body.members.find(m => m.userId === user1Id).role).toBe(RoleType.ADMIN);

        // Verify role update in database
        const userTeam = await userTeamRepository.findOne({
          where: {
            userId: user1Id,
            teamId: team2Id,
            status: UserTeamStatus.ACTIVE
          },
          relations: ['role']
        });
        expect(userTeam.role.name).toBe(RoleType.ADMIN);
      });

      it('should prevent non-owner from updating member roles', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/teams/${team2Id}/members/${user2Id}/role`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send({ role: RoleType.ADMIN });

        expect(response.status).toBe(409);
      });

      it('should prevent updating team owner role', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/teams/${team2Id}/members/${user2Id}/role`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({ role: RoleType.ADMIN });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe('Cannot modify team owner role');
      });

      it('should return 404 when updating role for non-existent member', async () => {
        const nonExistentUserId = '12345678-1234-1234-1234-123456789012';
        const response = await request(app.getHttpServer())
          .patch(`/teams/${team2Id}/members/${nonExistentUserId}/role`)
          .set('Authorization', `Bearer ${user2Token}`)
          .send({ role: RoleType.ADMIN });

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Team member not found');
      });
    });
  });
});