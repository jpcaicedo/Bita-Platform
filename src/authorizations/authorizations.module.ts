import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationsController } from './authorizations.controller';
import { AuthorizationsService } from './authorizations.service';
import { AuthorizationLogEntity } from './entities/authorization-log.entity';
import { WorkshopAuthorizationEntity } from './entities/workshop-authorization.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkshopAuthorizationEntity,
      AuthorizationLogEntity,
    ]),
  ],
  controllers: [AuthorizationsController],
  providers: [AuthorizationsService],
  exports: [AuthorizationsService],
})
export class AuthorizationsModule {}
