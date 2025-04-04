import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEmail, IsEnum } from 'class-validator';
import { RoleType } from 'src/role/role.entity';
import { TeamMemberResponseDto } from './team-member-response.dto';

export class TeamInvitationResponseDto {
    @ApiProperty({ description: 'The email address of the invited user' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'The team ID the user is invited to' })
    @IsUUID()
    teamId: string;

    @ApiProperty({ description: 'The current status of the invitation', enum: ['pending', 'accepted', 'rejected'] })
    @IsString()
    status: string;
}

export class CreateTeamDto {
    @ApiProperty({ description: 'The team\'s name', example: 'Engineering Team' })
    @IsString()
    name: string;
}

export class AddTeamMemberDto {
    @ApiProperty({ description: 'The UUID of the user to add to the team', example: '123e4567-e89b-12d3-a456-426614174000' })
    @IsUUID()
    userId: string;
}

export class TeamResponseDto {
    @ApiProperty({ description: 'The team\'s unique identifier' })
    @IsUUID()
    id: string;

    @ApiProperty({ description: 'The team\'s name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'The UUID of the team owner' })
    @IsUUID()
    ownerId: string;

    @ApiProperty({ description: 'The timestamp when the team was created' })
    createdAt: Date;

    @ApiProperty({ description: 'The list of team members', type: TeamMemberResponseDto, isArray: true })
    members: TeamMemberResponseDto[];
}

export class TeamMemberDto {
    @ApiProperty({ description: 'The member\'s unique identifier' })
    @IsUUID()
    id: string;

    @ApiProperty({ description: 'The member\'s display name' })
    @IsString()
    name: string;

    @ApiProperty({ description: 'The member\'s email address' })
    @IsString()
    email: string;
}

export class InviteTeamMemberDto {
    @ApiProperty({ description: 'The email address of the user to invite', example: 'user@example.com' })
    @IsString()
    email: string;

    @ApiProperty({ description: 'The role to assign to the invited user', example: 'admin', enum: ['admin', 'billing'], default: 'admin' })
    @IsString()
    role?: string = RoleType.ADMIN;
}