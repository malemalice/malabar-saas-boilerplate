import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '../../user/dto/user.dto';

export class SignupDto {
  @ApiProperty({ description: 'The user\'s email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'The user\'s password', example: 'password123' })
  password: string;

  @ApiProperty({ description: 'The user\'s display name', example: 'John Doe' })
  name: string;
}

export class LoginDto {
  @ApiProperty({ description: 'The user\'s email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'The user\'s password', example: 'password123' })
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'The authenticated user\'s information' })
  user: UserResponseDto;

  @ApiProperty({ description: 'The JWT authentication token' })
  token: string;
}