import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { reset } from '../../node_modules/@colors/colors/safe.d';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    signup: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
    getProfile: jest.fn(),
    changePassword: jest.fn(),
    refreshToken: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerification: jest.fn(),
    verifyResetToken: jest.fn(),
    resendVerificationEmail: jest.fn(),
    updateProfile: jest.fn(),
  };

  const mockUser = {
    id: 'test-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockAuthResponse = {
    user: mockUser,
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should successfully create a new user and return tokens', async () => {
      mockAuthService.signup.mockResolvedValue(mockAuthResponse);

      const result = await controller.signup(signupDto);

      expect(result).toBe(mockAuthResponse);
      expect(authService.signup).toHaveBeenCalledWith(
        signupDto.email,
        signupDto.password,
        signupDto.name
      );
    });

    it('should throw ConflictException when email already exists', async () => {
      mockAuthService.signup.mockRejectedValue(new ConflictException('Email already exists'));

      await expect(controller.signup(signupDto)).rejects.toThrow(ConflictException);
      expect(authService.signup).toHaveBeenCalledWith(
        signupDto.email,
        signupDto.password,
        signupDto.name
      );
    });
  });


  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return user and tokens when credentials are valid', async () => {
      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(result).toBe(mockAuthResponse);
      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });
  });

  describe('requestPasswordReset', () => {
    const email = 'test@example.com';
    const successResponse = { message: 'Password reset instructions sent to your email' };

    it('should successfully request password reset', async () => {
      mockAuthService.requestPasswordReset.mockResolvedValue(successResponse);

      const result = await controller.requestPasswordReset({ email });

      expect(result).toEqual(successResponse);
      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(email);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockAuthService.requestPasswordReset.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.requestPasswordReset({ email })).rejects.toThrow(NotFoundException);
      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(email);
    });

    it('should throw ConflictException when rate limit exceeded', async () => {
      const errorMessage = 'Too many reset attempts. Please wait 15 minutes before trying again.';
      mockAuthService.requestPasswordReset.mockRejectedValue(new ConflictException(errorMessage));

      await expect(controller.requestPasswordReset({ email })).rejects.toThrow(ConflictException);
      expect(mockAuthService.requestPasswordReset).toHaveBeenCalledWith(email);
    });
  });

  describe('getProfile', () => {
    it('should return the user profile from request object', () => {
      const req = { user: mockUser };
      const result = controller.getProfile(req);
      expect(result).toBe(mockUser);
    });
  });

  describe('resetPassword', () => {
    const resetPasswordDto = {
      token: 'valid-reset-token',
      newPassword: 'newPassword123'
    };

    const successResponse = { message: 'Password has been reset successfully' };

    it('should successfully reset password with valid token', async () => {
      mockAuthService.resetPassword.mockResolvedValue(successResponse);

      const result = await controller.resetPassword(resetPasswordDto);

      expect(result).toBe(successResponse);
      expect(authService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.token,
        resetPasswordDto.newPassword
      );
    });

    it('should throw UnauthorizedException when token is invalid or expired', async () => {
      mockAuthService.resetPassword.mockRejectedValue(
        new UnauthorizedException('Invalid or expired reset token')
      );

      await expect(controller.resetPassword(resetPasswordDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(authService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.token,
        resetPasswordDto.newPassword
      );
    });
  });

  describe('verifyEmail', () => {
    const verifyEmailDto = {
      token: 'valid-verification-token'
    };

    const successResponse = { message: 'Email verified successfully' };

    it('should successfully verify email with valid token', async () => {
      mockAuthService.verifyEmail = jest.fn().mockResolvedValue(successResponse);

      const result = await controller.verifyEmail(verifyEmailDto);

      expect(result).toBe(successResponse);
      expect(authService.verifyEmail).toHaveBeenCalledWith(verifyEmailDto.token);
    });

    it('should throw NotFoundException when token is invalid', async () => {
      mockAuthService.verifyEmail = jest.fn().mockRejectedValue(
        new NotFoundException('Invalid verification token')
      );

      await expect(controller.verifyEmail(verifyEmailDto)).rejects.toThrow(
        NotFoundException
      );
      expect(authService.verifyEmail).toHaveBeenCalledWith(verifyEmailDto.token);
    });
  });

  describe('resendVerification', () => {
    const resendVerificationDto = {
      email: 'test@example.com'
    };

    const successResponse = { message: 'Verification email sent successfully' };

    it('should successfully resend verification email', async () => {
      mockAuthService.resendVerificationEmail = jest.fn().mockResolvedValue(successResponse);

      const result = await controller.resendVerification(resendVerificationDto);

      expect(result).toBe(successResponse);
      expect(authService.resendVerificationEmail).toHaveBeenCalledWith(resendVerificationDto.email);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockAuthService.resendVerificationEmail = jest.fn().mockRejectedValue(
        new NotFoundException('User not found')
      );

      await expect(controller.resendVerification(resendVerificationDto)).rejects.toThrow(
        NotFoundException
      );
      expect(authService.resendVerificationEmail).toHaveBeenCalledWith(resendVerificationDto.email);
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto = {
      name: 'Updated Name'
    };

    const mockUpdatedUser = {
      ...mockUser,
      name: 'Updated Name'
    };

    it('should successfully update user profile', async () => {
      mockAuthService.updateProfile = jest.fn().mockResolvedValue(mockUpdatedUser);
      const req = { user: mockUser };

      const result = await controller.updateProfile(req, updateProfileDto);

      expect(result).toBe(mockUpdatedUser);
      expect(authService.updateProfile).toHaveBeenCalledWith(mockUser.id, updateProfileDto);
    });
  });

  describe('changePassword', () => {
    const changePasswordDto = {
      currentPassword: 'currentPassword123',
      newPassword: 'newPassword123'
    };

    const successResponse = { message: 'Password changed successfully' };
    const mockReq = {
      user: mockUser,
      ip: '127.0.0.1'
    };

    it('should successfully change password', async () => {
      mockAuthService.changePassword = jest.fn().mockResolvedValue(successResponse);

      const result = await controller.changePassword(mockReq, changePasswordDto);

      expect(result).toBe(successResponse);
      expect(authService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
        mockReq.ip
      );
    });

    it('should throw UnauthorizedException when current password is invalid', async () => {
      mockAuthService.changePassword = jest.fn().mockRejectedValue(
        new UnauthorizedException('Invalid current password')
      );

      await expect(controller.changePassword(mockReq, changePasswordDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(authService.changePassword).toHaveBeenCalledWith(
        mockUser.id,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
        mockReq.ip
      );
    });
  });

  describe('refreshToken', () => {
    const refreshTokenDto = {
      refreshToken: 'valid-refresh-token'
    };

    it('should successfully refresh access token', async () => {
      mockAuthService.refreshToken = jest.fn().mockResolvedValue(mockAuthResponse);

      const result = await controller.refreshToken(refreshTokenDto);

      expect(result).toBe(mockAuthResponse);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      mockAuthService.refreshToken = jest.fn().mockRejectedValue(
        new UnauthorizedException('Invalid or expired refresh token')
      );

      await expect(controller.refreshToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException
      );
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });
  });

});