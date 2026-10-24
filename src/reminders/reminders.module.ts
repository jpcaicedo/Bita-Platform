import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceTypesModule } from '../maintenance-types/maintenance-types.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { ReminderNotificationEntity } from './entities/reminder-notification.entity';
import { SmartReminderEntity } from './entities/smart-reminder.entity';
import { ReminderRulesService } from './reminder-rules.service';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmartReminderEntity, ReminderNotificationEntity]),
    VehiclesModule,
    MaintenanceTypesModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, ReminderRulesService],
  exports: [RemindersService],
})
export class RemindersModule {}
