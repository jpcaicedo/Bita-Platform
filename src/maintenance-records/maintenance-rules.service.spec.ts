import { MaintenanceTypeEntity } from '../maintenance-types/entities/maintenance-type.entity';
import { MaintenanceRulesService } from './maintenance-rules.service';

describe('MaintenanceRulesService', () => {
  const service = new MaintenanceRulesService();

  it('moves the due date by the interval in months', () => {
    const maintenanceType = {
      defaultIntervalMonths: 6,
      defaultIntervalKm: null,
    } as MaintenanceTypeEntity;

    const result = service.calculateNext(maintenanceType, '2026-01-01', 10000);

    expect(result).toEqual({ dueDate: '2026-07-01', dueKilometers: null });
  });

  it('moves the due kilometers by the interval in kilometers', () => {
    const maintenanceType = {
      defaultIntervalMonths: null,
      defaultIntervalKm: 5000,
    } as MaintenanceTypeEntity;

    const result = service.calculateNext(maintenanceType, '2026-01-01', 10000);

    expect(result).toEqual({ dueDate: null, dueKilometers: 15000 });
  });

  it('moves the due date and kilometers when both intervals exist', () => {
    const maintenanceType = {
      defaultIntervalMonths: 6,
      defaultIntervalKm: 5000,
    } as MaintenanceTypeEntity;

    const result = service.calculateNext(maintenanceType, '2026-01-01', 10000);

    expect(result).toEqual({ dueDate: '2026-07-01', dueKilometers: 15000 });
  });

  it('keeps null values when there is no interval', () => {
    const maintenanceType = {
      defaultIntervalMonths: null,
      defaultIntervalKm: null,
    } as MaintenanceTypeEntity;

    const result = service.calculateNext(maintenanceType, '2026-01-01', 10000);

    expect(result).toEqual({ dueDate: null, dueKilometers: null });
  });

  it('returns overdue when the kilometers were reached', () => {
    const next = {
      dueDate: null,
      dueKilometers: 10000,
    };

    const result = service.calculateHealthStatus(next, 10000);

    expect(result).toBe('overdue');
  });

  it('returns overdue when the due date passed', () => {
    const next = {
      dueDate: '2000-01-01',
      dueKilometers: null,
    };

    const result = service.calculateHealthStatus(next, 1000);

    expect(result).toBe('overdue');
  });

  it('returns upcoming when the kilometers are within 500 of the due value', () => {
    const next = {
      dueDate: null,
      dueKilometers: 10300,
    };

    const result = service.calculateHealthStatus(next, 10000);

    expect(result).toBe('upcoming');
  });

  it('returns upcoming when the due date is within 30 days', () => {
    const due = new Date();
    due.setUTCDate(due.getUTCDate() + 10);
    const next = {
      dueDate: due.toISOString().split('T')[0],
      dueKilometers: null,
    };

    const result = service.calculateHealthStatus(next, 1000);

    expect(result).toBe('upcoming');
  });

  it('returns up_to_date when nothing is close', () => {
    const next = {
      dueDate: '2999-01-01',
      dueKilometers: 50000,
    };

    const result = service.calculateHealthStatus(next, 10000);

    expect(result).toBe('up_to_date');
  });
});
