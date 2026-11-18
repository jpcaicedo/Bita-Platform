import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorizationsModule } from '../authorizations/authorizations.module';
import { MaintenanceTypesModule } from '../maintenance-types/maintenance-types.module';
import { RemindersModule } from '../reminders/reminders.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { WorkshopsModule } from '../workshops/workshops.module';
import { MaintenanceRecordEntity } from './entities/maintenance-record.entity';
import { MaintenanceRecordsController } from './maintenance-records.controller';
import { MaintenanceRecordsService } from './maintenance-records.service';
import { MaintenanceRulesService } from './maintenance-rules.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaintenanceRecordEntity]),
    VehiclesModule,
    MaintenanceTypesModule,
    AuthorizationsModule,
    WorkshopsModule,
    RemindersModule,
  ],
  controllers: [MaintenanceRecordsController],
  providers: [MaintenanceRecordsService, MaintenanceRulesService],
  exports: [MaintenanceRecordsService],
})
export class MaintenanceRecordsModule {}
