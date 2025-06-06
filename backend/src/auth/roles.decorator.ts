import { SetMetadata } from '@nestjs/common';
import { RoleType } from '../role/entities/role.entity';

export const Roles = (...roles: RoleType[]) => SetMetadata('roles', roles);