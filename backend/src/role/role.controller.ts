import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoleService } from './role.service';
import { Role } from './entities/role.entity';

@ApiTags('roles')
@Controller('roles')
@ApiBearerAuth()
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @ApiOperation({ summary: 'Get all available roles' })
    @ApiResponse({ status: 200, description: 'Returns all roles', type: [Role] })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @Get()
    @UseGuards(JwtAuthGuard)
    async getAllRoles(): Promise<Role[]> {
        return this.roleService.findAll();
    }
} 