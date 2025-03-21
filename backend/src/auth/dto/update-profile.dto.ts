import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ description: 'User\'s full name' })
  @IsString()
  @MinLength(2)
  name: string;
}