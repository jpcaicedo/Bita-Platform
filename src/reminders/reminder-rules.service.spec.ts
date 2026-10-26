import { SmartReminderEntity } from './entities/smart-reminder.entity';
import { ReminderRulesService } from './reminder-rules.service';

describe('ReminderRulesService', () => {
  const service = new ReminderRulesService();

  it('moves the due date and kilometers by the recurrence values', () => {
    const reminder = {
      dueDate: '2026-01-01',
      dueKilometers: 20000,
      recurrenceDays: 30,
      recurrenceKm: 5000,
    } as SmartReminderEntity;

    const result = service.calculateNextCycle(reminder, '2026-02-01', 21000);

    expect(result).toEqual({ dueDate: '2026-03-03', dueKilometers: 26000 });
  });

  it('keeps the current values when there is no recurrence', () => {
    const reminder = {
      dueDate: '2026-01-01',
      dueKilometers: 20000,
      recurrenceDays: null,
      recurrenceKm: null,
    } as SmartReminderEntity;

    const result = service.calculateNextCycle(reminder, '2026-02-01', 21000);

    expect(result).toEqual({ dueDate: '2026-01-01', dueKilometers: 20000 });
  });

  it('returns overdue when the kilometers were reached', () => {
    const reminder = {
      dueDate: null,
      dueKilometers: 10000,
      leadDays: 7,
      leadKilometers: 500,
    } as SmartReminderEntity;

    const result = service.evaluateTrigger(reminder, 10000);

    expect(result).toBe('overdue');
  });

  it('returns overdue when the due date passed', () => {
    const reminder = {
      dueDate: '2000-01-01',
      dueKilometers: null,
      leadDays: 7,
      leadKilometers: 500,
    } as SmartReminderEntity;

    const result = service.evaluateTrigger(reminder, 1000);

    expect(result).toBe('overdue');
  });

  it('returns upcoming when the kilometers are within the lead distance', () => {
    const reminder = {
      dueDate: null,
      dueKilometers: 10300,
      leadDays: 7,
      leadKilometers: 500,
    } as SmartReminderEntity;

    const result = service.evaluateTrigger(reminder, 10000);

    expect(result).toBe('upcoming');
  });

  it('returns null when nothing is close', () => {
    const reminder = {
      dueDate: '2999-01-01',
      dueKilometers: 50000,
      leadDays: 7,
      leadKilometers: 500,
    } as SmartReminderEntity;

    const result = service.evaluateTrigger(reminder, 10000);

    expect(result).toBe(null);
  });
});
