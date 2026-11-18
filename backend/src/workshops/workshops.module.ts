import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationsModule } from '../authorizations/authorizations.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WorkshopProfileEntity } from './entities/workshop-profile.entity';
import { WorkshopsController } from './workshops.controller';
import { WorkshopsService } from './workshops.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkshopProfileEntity]),
    VehiclesModule,
    AuthorizationsModule,
  ],
  controllers: [WorkshopsController],
  providers: [WorkshopsService],
  exports: [WorkshopsService],
})
export class WorkshopsModule {}
