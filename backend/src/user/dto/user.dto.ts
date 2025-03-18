import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ description: 'The user\'s email address', example: 'user@example.com' })
  email?: string;

  @ApiProperty({ description: 'The user\'s display name', example: 'John Doe' })
  name?: string;
}

export class UserResponseDto {
  @ApiProperty({ description: 'The user\'s unique identifier' })
  id: string;

  @ApiProperty({ description: 'The user\'s email address' })
  email: string;

  @ApiProperty({ description: 'The user\'s display name' })
  name: string;

  @ApiProperty({ description: 'The timestamp when the user was created' })
  createdAt: Date;

  @ApiProperty({ description: 'The timestamp when the user was last updated' })
  updatedAt: Date;
}