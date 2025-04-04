import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsEnum } from 'class-validator';
import { RoleType } from 'src/role/role.entity';

export class UpdateTeamMemberRoleDto {
    @ApiProperty({ description: 'The new role to assign to the team member', enum: RoleType })
    @IsEnum(RoleType)
    @IsString()
    role: RoleType;
}