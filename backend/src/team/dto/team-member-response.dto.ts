import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { RoleType } from '../../role/role.entity';

export class TeamMemberResponseDto {
    @ApiProperty({ description: 'The member\'s unique identifier' })
    @IsUUID()
    userId: string;

    @ApiProperty({ description: 'The member\'s display name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'The member\'s email address' })
    @IsString()
    email: string;

    @ApiProperty({ description: 'The member\'s role in the team', enum: RoleType })
    @IsString()
    role: RoleType;
}