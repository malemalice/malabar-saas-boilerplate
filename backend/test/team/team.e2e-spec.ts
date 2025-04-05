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

describe('TeamController - getTeamById (e2e)', () => {
  let authService: AuthService;
  let teamService: TeamService;
  let user1Token: string;
  let user2Token: string;
  let user3Token: string;
  let user1Id: string;
  let user2Id: string;
  let user3Id: string;
  let team1Id: string;
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
    const user3 = await authService.signup('user3@test.com', 'password123', 'User Three');
    user1Id = user1.user.id;
    user2Id = user2.user.id;
    user3Id = user3.user.id;

    // Login users
    const loginUser1 = await authService.login('user1@test.com', 'password123');
    const loginUser2 = await authService.login('user2@test.com', 'password123');
    const loginUser3 = await authService.login('user3@test.com', 'password123');
    user1Token = loginUser1.accessToken;
    user2Token = loginUser2.accessToken;
    user3Token = loginUser3.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /teams/:teamId', () => {
    beforeEach(async () => {
      // Get team1 created during signup
      const team1Response = await request(app.getHttpServer())
        .get('/teams/my-team')
        .set('Authorization', `Bearer ${user1Token}`);
      team1Id = team1Response.body.id;

      // User1 invites User2 to their team as admin
      await request(app.getHttpServer())
        .post(`/teams/${team1Id}/invite`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          email: 'user2@test.com',
          role: RoleType.BILLING
        });

      // User2 accepts invitation to User1's team
      await request(app.getHttpServer())
        .post(`/teams/invitations/${team1Id}/accept`)
        .set('Authorization', `Bearer ${user2Token}`);
    });

    it('should allow team owner to get team details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/teams/${team1Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(team1Id);
      expect(response.body.ownerId).toBe(user1Id);
      expect(response.body.members).toHaveLength(2);
      
      // Verify owner details
      const ownerMember = response.body.members.find(m => m.userId === user1Id);
      expect(ownerMember).toBeDefined();
      expect(ownerMember.role).toBe(RoleType.OWNER);
      expect(ownerMember.email).toBe('user1@test.com');

      // Verify admin member details
      const adminMember = response.body.members.find(m => m.userId === user2Id);
      expect(adminMember).toBeDefined();
      expect(adminMember.role).toBe(RoleType.BILLING);
      expect(adminMember.email).toBe('user2@test.com');
    });

    it('should allow team member to get team details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/teams/${team1Id}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(team1Id);
      expect(response.body.ownerId).toBe(user1Id);
      expect(response.body.members).toHaveLength(2);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get(`/teams/${team1Id}`);

      expect(response.status).toBe(401);
    });

    it('should return 404 when user is not a team member', async () => {
      const response = await request(app.getHttpServer())
        .get(`/teams/${team1Id}`)
        .set('Authorization', `Bearer ${user3Token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Team not found or user is not a member');
    });

    it('should return 404 when team does not exist', async () => {
      const nonExistentTeamId = '12345678-1234-1234-1234-123456789012';
      const response = await request(app.getHttpServer())
        .get(`/teams/${nonExistentTeamId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Team not found');
    });
  });
});