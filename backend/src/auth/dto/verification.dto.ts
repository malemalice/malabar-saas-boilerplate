import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty()
  @IsString()
  token: string;
}

export class ResendVerificationDto {
  @ApiProperty()
  @IsString()
  email: string;
}

export class VerificationResponseDto {
  @ApiProperty()
  message: string;
}