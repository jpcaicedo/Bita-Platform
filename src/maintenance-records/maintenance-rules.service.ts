import { BadRequestException, Injectable } from '@nestjs/common';
import { MaintenanceTypeEntity } from '../maintenance-types/entities/maintenance-type.entity';
import { MaintenanceRecordEntity } from './entities/maintenance-record.entity';

export type MaintenanceHealthStatus = 'up_to_date' | 'upcoming' | 'overdue';

export interface NextMaintenance {
  dueDate: string | null;
  dueKilometers: number | null;
}

@Injectable()
export class MaintenanceRulesService {
  ensureServiceDateIsNotInFuture(serviceDate: string): void {
    if (new Date(serviceDate) > new Date()) {
      throw new BadRequestException('Service date cannot be in the future');
    }
  }

  ensureKilometersAreNotLowerThanLast(
    kilometers: number,
    lastRecord: MaintenanceRecordEntity | null,
  ): void {
    if (lastRecord && kilometers < lastRecord.kilometers) {
      throw new BadRequestException(
        `Kilometers cannot be lower than the last registered value (${lastRecord.kilometers})`,
      );
    }
  }

  calculateNext(
    maintenanceType: MaintenanceTypeEntity,
    serviceDate: string,
    kilometers: number,
  ): NextMaintenance {
    let dueDate: string | null = null;
    let dueKilometers: number | null = null;

    if (maintenanceType.defaultIntervalMonths) {
      const date = new Date(serviceDate);
      date.setUTCMonth(date.getUTCMonth() + maintenanceType.defaultIntervalMonths);
      dueDate = date.toISOString().split('T')[0];
    }

    if (maintenanceType.defaultIntervalKm) {
      dueKilometers = kilometers + maintenanceType.defaultIntervalKm;
    }

    return { dueDate, dueKilometers };
  }

  calculateHealthStatus(
    next: NextMaintenance,
    currentKilometers: number,
  ): MaintenanceHealthStatus {
    const today = new Date();

    if (next.dueKilometers !== null && currentKilometers >= next.dueKilometers) {
      return 'overdue';
    }

    if (next.dueDate !== null && today >= new Date(next.dueDate)) {
      return 'overdue';
    }

    if (next.dueKilometers !== null && next.dueKilometers - currentKilometers <= 500) {
      return 'upcoming';
    }

    if (next.dueDate !== null) {
      const millisecondsLeft = new Date(next.dueDate).getTime() - today.getTime();
      const daysLeft = millisecondsLeft / (1000 * 60 * 60 * 24);

      if (daysLeft <= 30) {
        return 'upcoming';
      }
    }

    return 'up_to_date';
  }
}
