import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceTypeEntity } from './entities/maintenance-type.entity';
import { MaintenanceTypesController } from './maintenance-types.controller';
import { MaintenanceTypesService } from './maintenance-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([MaintenanceTypeEntity])],
  controllers: [MaintenanceTypesController],
  providers: [MaintenanceTypesService],
  exports: [MaintenanceTypesService],
})
export class MaintenanceTypesModule {}
