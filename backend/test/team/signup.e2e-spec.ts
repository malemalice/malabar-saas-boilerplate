import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/user/user.entity';
import { Team } from '../../src/team/team.entity';
import { UserTeam } from '../../src/team/entities/user-team.entity';
import { Repository, DataSource } from 'typeorm';
import { UserTeamStatus } from '../../src/team/enums/user-team-status.enum';
import { app } from '../setup';
import { seedRoles } from '../utils/seed-roles';
import { RoleType } from 'src/role/role.entity';

describe('Team Creation during Signup (e2e)', () => {
  let userRepository: Repository<User>;
  let teamRepository: Repository<Team>;
  let userTeamRepository: Repository<UserTeam>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Use the app instance from setup.ts that's already configured with test.env
    userRepository = app.get(getRepositoryToken(User));
    teamRepository = app.get(getRepositoryToken(Team));
    userTeamRepository = app.get(getRepositoryToken(UserTeam));
    dataSource = app.get(DataSource);
  });

  beforeEach(async () => {
    // Clear all tables before each test
    await dataSource.synchronize(true);
    // Seed roles after clearing database
    await seedRoles(dataSource);
  });

  describe('POST /auth/signup', () => {
    const newUser = {
      email: 'newuser@example.com',
      password: 'password123',
      name: 'New User'
    };

    it('should create a team automatically when user signs up', async () => {
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(newUser);

      expect(signupResponse.status).toBe(201);

      const user = await userRepository.findOne({
        where: { email: newUser.email }
      });

      expect(user).toBeDefined();

      const team = await teamRepository.findOne({
        where: { ownerId: user.id }
      });

      expect(team).toBeDefined();

      const userTeam = await userTeamRepository.findOne({
        where: { userId: user.id, teamId: team.id },
        relations: ['role']
      });

      expect(userTeam).toBeDefined();
      expect(userTeam.status).toBe(UserTeamStatus.ACTIVE);
      expect(userTeam.role.name).toBe(RoleType.OWNER);

      // Get team details and verify member response format
      const teamResponse = await request(app.getHttpServer())
        .get('/teams/my-team')
        .set('Authorization', `Bearer ${signupResponse.body.accessToken}`);

      expect(teamResponse.status).toBe(200);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});