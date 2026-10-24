import {
    BadRequestException,
    ConflictException,
    Injectable,
  } from '@nestjs/common';
  import { CreateReminderDto } from './dto/create-reminder.dto';
  import { SmartReminderEntity } from './entities/smart-reminder.entity';
  
  export type ReminderTrigger = 'upcoming' | 'overdue';
  
  export interface ReminderCycle {
    dueDate: string | null;
    dueKilometers: number | null;
  }
  
  @Injectable()
  export class ReminderRulesService {
    ensureThresholdsAreValid(
      dto: CreateReminderDto,
      currentKilometers: number,
    ): void {
      if (dto.criteria === 'due_date' && !dto.dueDate) {
        throw new BadRequestException(
          'dueDate is required when criteria is due_date',
        );
      }
  
      if (dto.criteria === 'due_kilometers' && dto.dueKilometers === undefined) {
        throw new BadRequestException(
          'dueKilometers is required when criteria is due_kilometers',
        );
      }
  
      const today = new Date().toISOString().split('T')[0];
  
      if (dto.dueDate && dto.dueDate.slice(0, 10) < today) {
        throw new BadRequestException('dueDate cannot be in the past');
      }
  
      if (
        dto.dueKilometers !== undefined &&
        dto.dueKilometers <= currentKilometers
      ) {
        throw new BadRequestException(
          'dueKilometers must be greater than the current kilometers of the vehicle',
        );
      }
    }
  
    ensureRecurrenceIsValid(dto: CreateReminderDto): void {
      if (!dto.recurring) {
        return;
      }
  
      if (dto.dueDate && !dto.recurrenceDays) {
        throw new BadRequestException(
          'recurrenceDays is required for recurring reminders with dueDate',
        );
      }
  
      if (dto.dueKilometers !== undefined && !dto.recurrenceKm) {
        throw new BadRequestException(
          'recurrenceKm is required for recurring reminders with dueKilometers',
        );
      }
    }
  
  }
  