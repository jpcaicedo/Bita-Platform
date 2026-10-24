import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceRecordEntity } from './entities/maintenance-record.entity';
import { MaintenanceRecordsController } from './maintenance-records.controller';
import { MaintenanceRecordsService } from './maintenance-records.service';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceRecordEntity])],
  controllers: [MaintenanceRecordsController],
  providers: [MaintenanceRecordsService],
  exports: [MaintenanceRecordsService],
})
export class MaintenanceRecordsModule {}
