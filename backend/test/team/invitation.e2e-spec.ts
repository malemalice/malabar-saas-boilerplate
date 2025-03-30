import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/user/user.entity';
import { Team } from '../../src/team/team.entity';
import { TeamInvitation } from '../../src/team/entities/team-invitation.entity';
import { Repository, DataSource } from 'typeorm';
import { app } from '../setup';
import { seedRoles } from '../utils/seed-roles';
import { UserTeam } from 'src/team/entities/user-team.entity';
import { UserTeamStatus } from 'src/team/enums/user-team-status.enum';
import { RoleType } from 'src/role/role.entity';

describe('Team Invitation (e2e)', () => {
  let userRepository: Repository<User>;
  let teamRepository: Repository<Team>;
  let teamInvitationRepository: Repository<TeamInvitation>;
  let dataSource: DataSource;

  beforeAll(async () => {
    userRepository = app.get(getRepositoryToken(User));
    teamRepository = app.get(getRepositoryToken(Team));
    teamInvitationRepository = app.get(getRepositoryToken(TeamInvitation));
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
    await seedRoles(dataSource);
  });

  describe('Team Invitation for Unsigned User', () => {
    let ownerUser: User;
    let team: Team;

    beforeEach(async () => {
      // Create owner user
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'owner@example.com',
          password: 'password123',
          name: 'Team Owner'
        });

      ownerUser = await userRepository.findOne({
        where: { email: 'owner@example.com' }
      });

      // Get auth token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'owner@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.accessToken;

      // Get my team
      const teamResponse = await request(app.getHttpServer())
        .get('/teams/my-team')
        .set('Authorization', `Bearer ${token}`);
      team = await teamRepository.findOne({
        where: { id: teamResponse.body.id }
      });
    });

    it('should create invitation for unsigned user', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'owner@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.accessToken;
      const inviteeEmail = 'newuser@example.com';

      expect(team.id).toBeDefined();
      // Send invitation with default role
      const response = await request(app.getHttpServer())
        .post(`/teams/${team.id}/invite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: inviteeEmail , role: RoleType.ADMIN});
      expect(response.status).toBe(201);

      // Verify invitation record
      const invitation = await teamInvitationRepository.findOne({
        where: { email: inviteeEmail, teamId: team.id }
      });

      expect(invitation).toBeDefined();
      expect(invitation.email).toBe(inviteeEmail);
      expect(invitation.teamId).toBe(team.id);
      expect(invitation.token).toBeDefined();

      // Verify invitation can be retrieved
      const invitationResponse = await request(app.getHttpServer())
        .get(`/teams/invitations/${invitation.token}`)
        .send();

      expect(invitationResponse.status).toBe(200);
      expect(invitationResponse.body.email).toBe(inviteeEmail);
      expect(invitationResponse.body.teamId).toBe(team.id);
    });
  });

  describe('Team Invitation for Signed User', () => {
    let ownerUser: User;
    let team: Team;
    let inviteeUser: User;
    let userTeamRepository: Repository<UserTeam>;

    beforeEach(async () => {
      userTeamRepository = app.get(getRepositoryToken(UserTeam));

      // Create owner user
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'owner@example.com',
          password: 'password123',
          name: 'Team Owner'
        });

      ownerUser = await userRepository.findOne({
        where: { email: 'owner@example.com' }
      });

      // Create invitee user
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'invitee@example.com',
          password: 'password123',
          name: 'Invitee User'
        });

      inviteeUser = await userRepository.findOne({
        where: { email: 'invitee@example.com' }
      });

      // Get auth token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'owner@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.accessToken;

      // Get my team
      const teamResponse = await request(app.getHttpServer())
        .get('/teams/my-team')
        .set('Authorization', `Bearer ${token}`);
      team = await teamRepository.findOne({
        where: { id: teamResponse.body.id }
      });
    });

    it('should create user-team record with explicit role for signed user', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'owner@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.accessToken;

      expect(team.id).toBeDefined();
      // Send invitation with explicit role
      const response = await request(app.getHttpServer())
        .post(`/teams/${team.id}/invite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: inviteeUser.email, role: RoleType.BILLING });
      expect(response.status).toBe(201);

      // Verify user-team record
      const userTeam = await userTeamRepository.findOne({
        where: { userId: inviteeUser.id, teamId: team.id },
        relations: ['role']
      });

      expect(userTeam).toBeDefined();
      expect(userTeam.userId).toBe(inviteeUser.id);
      expect(userTeam.teamId).toBe(team.id);
      expect(userTeam.status).toBe(UserTeamStatus.INVITING);
      expect(userTeam.role.name).toBe(RoleType.BILLING);

      // Verify no invitation record was created
      const invitation = await teamInvitationRepository.findOne({
        where: { email: inviteeUser.email, teamId: team.id }
      });
      expect(invitation).toBeNull();
    });

    it('should create user-team record with default role for signed user', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'owner@example.com',
          password: 'password123'
        });

      const token = loginResponse.body.accessToken;

      expect(team.id).toBeDefined();
      // Send invitation without specifying role (should use default)
      const response = await request(app.getHttpServer())
        .post(`/teams/${team.id}/invite`)
        .set('Authorization', `Bearer ${token}`)
        .send({ email: inviteeUser.email });
      expect(response.status).toBe(201);

      // Verify user-team record
      const userTeam = await userTeamRepository.findOne({
        where: { userId: inviteeUser.id, teamId: team.id },
        relations: ['role']
      });

      expect(userTeam).toBeDefined();
      expect(userTeam.userId).toBe(inviteeUser.id);
      expect(userTeam.teamId).toBe(team.id);
      expect(userTeam.status).toBe(UserTeamStatus.INVITING);
      expect(userTeam.role.name).toBe(RoleType.ADMIN);

      // Verify no invitation record was created
      const invitation = await teamInvitationRepository.findOne({
        where: { email: inviteeUser.email, teamId: team.id }
      });
      expect(invitation).toBeNull();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});