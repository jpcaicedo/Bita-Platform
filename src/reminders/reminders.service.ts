import {
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { AuthenticatedUser } from '../auth/authenticated-user.interface';
  import { MaintenanceTypesService } from '../maintenance-types/maintenance-types.service';
  import { VehiclesService } from '../vehicles/vehicles.service';
  import { CompleteReminderDto } from './dto/complete-reminder.dto';
  import { CreateReminderDto } from './dto/create-reminder.dto';
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
  
    async create(
      vehicleId: string,
      user: AuthenticatedUser,
      dto: CreateReminderDto,
    ): Promise<SmartReminderEntity> {
      const vehicle = await this.vehiclesService.findOwnedOrFail(
        vehicleId,
        user.id,
      );
  
      this.reminderRulesService.ensureThresholdsAreValid(
        dto,
        vehicle.currentKilometers,
      );
      this.reminderRulesService.ensureRecurrenceIsValid(dto);
  
      if (dto.maintenanceTypeId) {
        await this.maintenanceTypesService.findActiveOrFail(
          dto.maintenanceTypeId,
        );
      }
  
      const recurring = dto.recurring ?? false;
  
      const reminder = this.remindersRepository.create({
        vehicleId: vehicle.id,
        createdById: user.id,
        maintenanceTypeId: dto.maintenanceTypeId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        criteria: dto.criteria,
        dueDate: dto.dueDate ? dto.dueDate.slice(0, 10) : null,
        dueKilometers: dto.dueKilometers ?? null,
        leadDays: dto.leadDays ?? 7,
        leadKilometers: dto.leadKilometers ?? 500,
        recurring,
        recurrenceDays: recurring ? (dto.recurrenceDays ?? null) : null,
        recurrenceKm: recurring ? (dto.recurrenceKm ?? null) : null,
        status: 'pending',
      });
  
      return this.remindersRepository.save(reminder);
    }
  
    async findByVehicle(
      vehicleId: string,
      userId: string,
    ): Promise<SmartReminderEntity[]> {
      await this.vehiclesService.findOwnedOrFail(vehicleId, userId);
  
      return this.remindersRepository.find({
        where: { vehicleId },
        relations: { maintenanceType: true },
        order: { dueDate: 'ASC' },
      });
    }
  
    async complete(
      id: string,
      user: AuthenticatedUser,
      dto: CompleteReminderDto,
    ): Promise<SmartReminderEntity> {
      const reminder = await this.remindersRepository.findOne({
        where: { id },
        relations: { vehicle: true },
      });
  
      if (!reminder) {
        throw new NotFoundException(`Reminder with id ${id} not found`);
      }
  
      if (reminder.vehicle.ownerId !== user.id) {
        throw new ForbiddenException('You are not the owner of this vehicle');
      }
  
      this.reminderRulesService.ensureCanBeCompleted(reminder);
  
      const kilometers = dto.kilometers ?? reminder.vehicle.currentKilometers;
  
      this.reminderRulesService.ensureKilometersAreNotLower(
        kilometers,
        reminder.vehicle.currentKilometers,
      );
  
      if (dto.kilometers !== undefined) {
        await this.vehiclesService.registerKilometers(
          reminder.vehicleId,
          dto.kilometers,
        );
      }
  
      return this.applyCompletion(reminder, new Date().toISOString().split('T')[0], kilometers);
    }
  
    
  }
  