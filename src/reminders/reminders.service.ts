import {
    Injectable,
    Logger,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { MaintenanceTypesService } from '../maintenance-types/maintenance-types.service';
  import { VehiclesService } from '../vehicles/vehicles.service';

  import { ReminderNotificationEntity } from './entities/reminder-notification.entity';
  import {
    ReminderStatus,
    SmartReminderEntity,
  } from './entities/smart-reminder.entity';
  import { ReminderRulesService } from './reminder-rules.service';
  
  @Injectable()
  export class RemindersService {
    private readonly logger = new Logger(RemindersService.name);
  
    constructor(
      @InjectRepository(SmartReminderEntity)
      private readonly remindersRepository: Repository<SmartReminderEntity>,
      @InjectRepository(ReminderNotificationEntity)
      private readonly notificationsRepository: Repository<ReminderNotificationEntity>,
      private readonly vehiclesService: VehiclesService,
      private readonly maintenanceTypesService: MaintenanceTypesService,
      private readonly reminderRulesService: ReminderRulesService,
    ) {}
  

  }
  