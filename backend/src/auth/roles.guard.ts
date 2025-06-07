import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '../role/entities/role.entity';
import { TeamService } from '../team/team.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private teamService: TeamService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<RoleType[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { user } = request;
    const teamId = request.params.teamId;

    if (!user || !teamId) {
      return false;
    }

    // Get user's role for specific team
    const userTeam = await this.teamService.getUserTeamRole(teamId, user.id);
    if (!userTeam || !userTeam.role) {
      return false;
    }

    return requiredRoles.some((role) => userTeam.role.name === role);
  }
}