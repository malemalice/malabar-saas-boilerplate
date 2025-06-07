import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { UserTeam } from './entities/user-team.entity';
import { TeamInvitation } from './entities/team-invitation.entity';
import { UserModule } from '../user/user.module';
import { RoleModule } from '../role/role.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        TypeOrmModule.forFeature([Team, UserTeam, TeamInvitation]),
        UserModule,
        RoleModule,
        MailerModule,
        ConfigModule,
    ],
    controllers: [TeamController],
    providers: [TeamService],
    exports: [TeamService],
})
export class TeamModule {}