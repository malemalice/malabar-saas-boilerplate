import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserService } from '../user/user.service';
import { VerificationToken } from './entities/verification-token.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { PasswordResetRateLimit } from './entities/password-reset-rate-limit.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
    @InjectRepository(VerificationToken)
    private verificationTokenRepo: Repository<VerificationToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepo: Repository<PasswordResetToken>,
    @InjectRepository(PasswordResetRateLimit)
    private passwordResetRateLimitRepo: Repository<PasswordResetRateLimit>,
  ) {}

  async signup(email: string, password: string, name: string) {
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userService.create({
      email,
      password: hashedPassword,
      name,
    });

    const token = this.generateToken(user.id);
    await this.sendVerificationEmail(user);
    return { user, token };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id);
    await this.sendVerificationEmail(user);
    return { user, token };
  }

  private generateToken(userId: string) {
    return this.jwtService.sign({ sub: userId });
  }

  async updateProfile(userId: string, updateData: { name: string }) {
    return this.userService.update(userId, updateData);
  }

  private async generateVerificationToken(userId: string): Promise<VerificationToken> {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const verificationToken = this.verificationTokenRepo.create({
      token,
      userId,
      expiresAt,
    });

    return this.verificationTokenRepo.save(verificationToken);
  }

  private async sendVerificationEmail(user: any) {
    const verificationToken = await this.generateVerificationToken(user.id);
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verificationToken.token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Please verify your email',
      template: './verification',
      context: {
        name: user.name,
        url: verificationUrl,
      },
    });
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check rate limit
    const rateLimit = await this.passwordResetRateLimitRepo.findOne({ where: { email } });
    const now = new Date();

    if (rateLimit) {
      if (now < rateLimit.nextAllowedAttempt) {
        const waitMinutes = Math.ceil((rateLimit.nextAllowedAttempt.getTime() - now.getTime()) / (1000 * 60));
        throw new ConflictException(`Too many reset attempts. Please wait ${waitMinutes} minutes before trying again.`);
      }

      // Update rate limit
      rateLimit.attemptCount += 1;
      rateLimit.lastAttempt = now;
      rateLimit.nextAllowedAttempt = new Date(now.getTime() + this.calculateCooldown(rateLimit.attemptCount));
      await this.passwordResetRateLimitRepo.save(rateLimit);
    } else {
      // Create new rate limit entry
      const newRateLimit = this.passwordResetRateLimitRepo.create({
        email,
        attemptCount: 1,
        lastAttempt: now,
        nextAllowedAttempt: new Date(now.getTime() + this.calculateCooldown(1))
      });
      await this.passwordResetRateLimitRepo.save(newRateLimit);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const resetToken = this.passwordResetTokenRepo.create({
      token,
      userId: user.id,
      expiresAt,
    });

    await this.passwordResetTokenRepo.save(resetToken);
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset Your Password',
      template: './password-reset',
      context: {
        name: user.name,
        resetUrl,
      },
    });

    return { message: 'Password reset instructions sent to your email' };
  }

  private calculateCooldown(attemptCount: number): number {
    // Base cooldown of 15 minutes
    const baseCooldown = 15 * 60 * 1000; // 15 minutes in milliseconds
    
    // Exponential backoff: doubles the cooldown for each attempt
    return baseCooldown * Math.pow(2, attemptCount - 1);
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const resetToken = await this.passwordResetTokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userService.update(resetToken.userId, { password: hashedPassword });
    await this.passwordResetTokenRepo.remove(resetToken);

    return { message: 'Password has been reset successfully' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verificationToken = await this.verificationTokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!verificationToken) {
      throw new NotFoundException('Invalid verification token');
    }

    if (verificationToken.expiresAt < new Date()) {
      await this.verificationTokenRepo.remove(verificationToken);
      throw new UnauthorizedException('Verification token has expired');
    }

    verificationToken.user.isVerified = true;
    await this.userService.update(verificationToken.user.id, { isVerified: true });
    await this.verificationTokenRepo.remove(verificationToken);

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string; nextResendTime?: Date }> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isVerified) {
      throw new ConflictException('Email is already verified');
    }

    const existingToken = await this.verificationTokenRepo.findOne({
      where: { userId: user.id },
      order: { createdAt: 'DESC' }
    });

    if (existingToken) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (existingToken.createdAt > fiveMinutesAgo) {
        const nextResendTime = new Date(existingToken.createdAt.getTime() + 5 * 60 * 1000);
        throw new ConflictException({
          message: 'Please wait before requesting another verification email',
          nextResendTime
        });
      }
      await this.verificationTokenRepo.remove(existingToken);
    }

    await this.sendVerificationEmail(user);
    return { message: 'Verification email sent successfully' };
  }
}