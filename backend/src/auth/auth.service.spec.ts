import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VerificationToken } from './entities/verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordResetRateLimit } from './entities/password-reset-rate-limit.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailerService: jest.Mocked<MailerService>;
  let verificationTokenRepo: MockRepository<VerificationToken>;
  let passwordResetTokenRepo: MockRepository<PasswordResetToken>;
  let passwordResetRateLimitRepo: MockRepository<PasswordResetRateLimit>;
  let refreshTokenRepo: MockRepository<RefreshToken>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    password: 'hashed_password',
    name: 'Test User',
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    verificationTokens: [],
    teams: null,
  };

  beforeEach(async () => {
    const mockUserService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock_token')
    };

    const mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(undefined)
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('http://localhost:3000')
    };

    const createMockRepo = (): MockRepository => ({
      create: jest.fn().mockReturnValue({}),
      save: jest.fn().mockResolvedValue({}),
      findOne: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined)
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailerService, useValue: mockMailerService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getRepositoryToken(VerificationToken), useValue: createMockRepo() },
        { provide: getRepositoryToken(PasswordResetToken), useValue: createMockRepo() },
        { provide: getRepositoryToken(PasswordResetRateLimit), useValue: createMockRepo() },
        { provide: getRepositoryToken(RefreshToken), useValue: createMockRepo() }
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    mailerService = module.get(MailerService);
    configService = module.get(ConfigService);
    verificationTokenRepo = module.get(getRepositoryToken(VerificationToken));
    passwordResetTokenRepo = module.get(getRepositoryToken(PasswordResetToken));
    passwordResetRateLimitRepo = module.get(getRepositoryToken(PasswordResetRateLimit));
    refreshTokenRepo = module.get(getRepositoryToken(RefreshToken));

    jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashed_password'));
    jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
  });

  describe('signup', () => {
    it('should create a new user and return tokens', async () => {
      userService.findByEmail.mockResolvedValue(null);
      userService.create.mockResolvedValue(mockUser);
      refreshTokenRepo.save.mockResolvedValue({ token: 'refresh_token' });

      const result = await service.signup('test@example.com', 'password', 'Test User');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(userService.create).toHaveBeenCalled();
      expect(mailerService.sendMail).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.signup('test@example.com', 'password', 'Test User'))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return user and tokens on successful login', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      refreshTokenRepo.save.mockResolvedValue({ token: 'refresh_token' });

      const result = await service.login('test@example.com', 'password');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.login('test@example.com', 'password'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementationOnce(() => Promise.resolve(false));

      await expect(service.login('test@example.com', 'wrong_password'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const mockToken = {
        token: 'valid_token',
        user: mockUser,
        expiresAt: new Date(Date.now() + 3600000)
      };
      verificationTokenRepo.findOne.mockResolvedValue(mockToken);

      const result = await service.verifyEmail('valid_token');

      expect(result.message).toBe('Email verified successfully');
      expect(userService.update).toHaveBeenCalledWith(mockUser.id, { isVerified: true });
    });

    it('should throw NotFoundException for invalid token', async () => {
        verificationTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid_token'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email', async () => {
      userService.findByEmail.mockResolvedValue(mockUser);
      passwordResetRateLimitRepo.findOne.mockResolvedValue(null);

      const result = await service.requestPasswordReset('test@example.com');

      expect(result.message).toBe('Password reset instructions sent to your email');
      expect(mailerService.sendMail).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(service.requestPasswordReset('nonexistent@example.com'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const mockResetToken = {
        token: 'valid_token',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 3600000)
      };
      passwordResetTokenRepo.findOne.mockResolvedValue(mockResetToken);

      const result = await service.resetPassword('valid_token', 'new_password');

      expect(result.message).toBe('Password has been reset successfully');
      expect(userService.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      passwordResetTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.resetPassword('invalid_token', 'new_password'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens on successful refresh', async () => {
      const mockStoredToken = {
        token: 'valid_refresh_token',
        userId: mockUser.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 3600000)
      };
      refreshTokenRepo.findOne.mockResolvedValue(mockStoredToken);
      userService.findById.mockResolvedValue(mockUser);

      const result = await service.refreshToken('valid_refresh_token');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(refreshTokenRepo.save).toHaveBeenCalledWith(expect.objectContaining({ isRevoked: true }));
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      refreshTokenRepo.findOne.mockResolvedValue(null);

      await expect(service.refreshToken('invalid_refresh_token'))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});