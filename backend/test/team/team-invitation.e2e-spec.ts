import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/user/user.entity';
import { Team } from '../../src/team/team.entity';
import { TeamInvitation } from '../../src/team/entities/team-invitation.entity';
import { UserTeam } from '../../src/team/entities/user-team.entity';
import { Repository, DataSource } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { UserTeamStatus } from '../../src/team/enums/user-team-status.enum';
import { RoleType } from 'src/role/role.entity';

describe('Team Invitation (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let teamRepository: Repository<Team>;
  let teamInvitationRepository: Repository<TeamInvitation>;
  let userTeamRepository: Repository<UserTeam>;
  let mailerService: MailerService;
  let dataSource: DataSource;

  const testUser = {
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    isVerified: true
  };

  const invitedUser = {
    email: 'invited@example.com',
    password: 'password123',
    name: 'Invited User',
    isVerified: true
  };

  const nonExistingUserEmail = 'nonexisting@example.com';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue({
        sendMail: jest.fn().mockResolvedValue(true),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    teamRepository = moduleFixture.get(getRepositoryToken(Team));
    teamInvitationRepository = moduleFixture.get(getRepositoryToken(TeamInvitation));
    userTeamRepository = moduleFixture.get(getRepositoryToken(UserTeam));
    mailerService = moduleFixture.get(MailerService);
    dataSource = moduleFixture.get(DataSource);
  });

  beforeEach(async () => {
    // Clear all tables before each test
    await dataSource.synchronize(true);

    // Create test users
    await userRepository.save([testUser, invitedUser]);
  });

  describe('POST /team/create', () => {
    it('should create a team and set creator as owner', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const { accessToken } = loginResponse.body;

      const createTeamResponse = await request(app.getHttpServer())
        .post('/team/create')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test Team' });

      expect(createTeamResponse.status).toBe(201);
      expect(createTeamResponse.body).toHaveProperty('id');

      const userTeam = await userTeamRepository.findOne({
        where: { teamId: createTeamResponse.body.id },
        relations: ['user']
      });

      expect(userTeam.status).toBe(UserTeamStatus.ACTIVE);
      expect(userTeam.user.email).toBe(testUser.email);
      expect(userTeam.role.name).toBe(RoleType.OWNER);
    });
  });

  describe('POST /team/:teamId/invite', () => {
    let teamId: string;
    let accessToken: string;

    beforeEach(async () => {
      // Login and create team
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      accessToken = loginResponse.body.accessToken;

      const createTeamResponse = await request(app.getHttpServer())
        .post('/team/create')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test Team' });

      teamId = createTeamResponse.body.id;
    });

    it('should send invitation to existing user', async () => {
      const response = await request(app.getHttpServer())
        .post(`/team/${teamId}/invite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: invitedUser.email });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Invitation sent');

      const invitation = await teamInvitationRepository.findOne({
        where: { email: invitedUser.email },
        relations: ['team']
      });

      expect(invitation).toBeDefined();
      expect(invitation.team.id).toBe(teamId);
      expect(mailerService.sendMail).toHaveBeenCalled();
    });

    it('should send invitation to non-existing user', async () => {
      const response = await request(app.getHttpServer())
        .post(`/team/${teamId}/invite`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: nonExistingUserEmail });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Invitation sent');

      const invitation = await teamInvitationRepository.findOne({
        where: { email: nonExistingUserEmail },
        relations: ['team']
      });

      expect(invitation).toBeDefined();
      expect(invitation.team.id).toBe(teamId);
      expect(mailerService.sendMail).toHaveBeenCalled();
    });
  });

  describe('POST /team/invitation/:token/accept', () => {
    let invitation: TeamInvitation;

    beforeEach(async () => {
      // Create team and invitation
      const team = await teamRepository.save({ name: 'Test Team' });
      await userTeamRepository.save({
        user: await userRepository.findOne({ where: { email: testUser.email } }),
        team,
        status: UserTeamStatus.INVITING
      });

      invitation = await teamInvitationRepository.save({
        team,
        email: invitedUser.email,
        token: 'test-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    });

    it('should accept invitation and add user to team', async () => {
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: invitedUser.email, password: invitedUser.password });

      const response = await request(app.getHttpServer())
        .post(`/team/invitation/${invitation.token}/accept`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('successfully joined');

      const userTeam = await userTeamRepository.findOne({
        where: {
          userId: (await userRepository.findOne({ where: { email: invitedUser.email } })).id,
          teamId: invitation.team.id
        }
      });

      expect(userTeam).toBeDefined();
      expect(userTeam.status).toBe(UserTeamStatus.ACTIVE);
      expect(userTeam.role.name).toBe(RoleType.MEMBER);

      const invitationExists = await teamInvitationRepository.findOne({
        where: { token: invitation.token }
      });
      expect(invitationExists).toBeNull();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});