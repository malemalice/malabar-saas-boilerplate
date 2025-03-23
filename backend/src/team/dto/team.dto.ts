import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

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

    @ApiProperty({ description: 'The list of team members', type: 'array', isArray: true })
    members: TeamMemberDto[];
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