import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WorkshopProfileEntity } from '../workshops/entities/workshop-profile.entity';
import { AuthorizationRulesService } from './authorization-rules.service';
import { AuthorizationsController } from './authorizations.controller';
import { AuthorizationsService } from './authorizations.service';
import { AuthorizationLogEntity } from './entities/authorization-log.entity';
import { WorkshopAuthorizationEntity } from './entities/workshop-authorization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkshopAuthorizationEntity,
      AuthorizationLogEntity,
      WorkshopProfileEntity,
    ]),
    VehiclesModule,
  ],
  controllers: [AuthorizationsController],
  providers: [AuthorizationsService, AuthorizationRulesService],
  exports: [AuthorizationsService],
})
export class AuthorizationsModule {}
