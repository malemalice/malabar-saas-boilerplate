import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { Team } from './team.entity';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Team]),
        UserModule,
    ],
    controllers: [TeamController],
    providers: [TeamService],
    exports: [TeamService],
})
export class TeamModule {}