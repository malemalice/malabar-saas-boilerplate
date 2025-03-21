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
import { ConflictException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;
  let mailerService: jest.Mocked<MailerService>;
  let verificationTokenRepo: jest.Mocked<any>;
  let configService: jest.Mocked<ConfigService>;

  const mockUserService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockMailerService = {
    sendMail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(VerificationToken),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PasswordResetToken),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(PasswordResetRateLimit),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
    mailerService = module.get(MailerService);
    verificationTokenRepo = module.get(getRepositoryToken(VerificationToken));
    configService = module.get(ConfigService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const mockUser = {
      id: 'user-123',
      ...signupData,
    };

    const mockAccessToken = 'mock-access-token';
    const mockRefreshToken = 'mock-refresh-token';
    const mockVerificationToken = {
      token: 'verification-token',
      expiresAt: new Date(),
    };

    it('should successfully create a new user and return tokens', async () => {
      // Mock dependencies
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockAccessToken);
      mockRepository.create.mockReturnValue(mockVerificationToken);
      mockRepository.save.mockResolvedValue(mockVerificationToken);
      mockConfigService.get.mockReturnValue('http://frontend-url');
      mockMailerService.sendMail.mockResolvedValue(undefined);

      const result = await service.signup(
        signupData.email,
        signupData.password,
        signupData.name
      );

      expect(result).toEqual({
        user: mockUser,
        accessToken: mockAccessToken,
        refreshToken: expect.any(String),
      });

      expect(mockUserService.findByEmail).toHaveBeenCalledWith(signupData.email);
      expect(mockUserService.create).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockMailerService.sendMail).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.signup(signupData.email, signupData.password, signupData.name)
      ).rejects.toThrow(ConflictException);

      expect(mockUserService.create).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
      expect(mockMailerService.sendMail).not.toHaveBeenCalled();
    });

    it('should send verification email with correct data', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockAccessToken);
      mockRepository.create.mockReturnValue(mockVerificationToken);
      mockRepository.save.mockResolvedValue(mockVerificationToken);
      mockConfigService.get.mockReturnValue('http://frontend-url');

      await service.signup(
        signupData.email,
        signupData.password,
        signupData.name
      );

      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to: signupData.email,
        subject: 'Please verify your email',
        template: './verification',
        context: {
          name: signupData.name,
          url: expect.stringContaining('verify-email?token='),
        },
      });
    });
  });
});