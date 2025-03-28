import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleType } from './role.entity';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
    ) {}

    async findById(id: string): Promise<Role> {
        return this.roleRepository.findOne({ where: { id } });
    }

    async findByName(name: RoleType): Promise<Role> {
        return this.roleRepository.findOne({ where: { name } });
    }

    async createRole(name: RoleType): Promise<Role> {
        const role = this.roleRepository.create({ name });
        return this.roleRepository.save(role);
    }

    async initializeRoles(): Promise<void> {
        const roles = Object.values(RoleType);
        for (const roleName of roles) {
            const existingRole = await this.findByName(roleName);
            if (!existingRole) {
                await this.createRole(roleName);
            }
        }
    }
}