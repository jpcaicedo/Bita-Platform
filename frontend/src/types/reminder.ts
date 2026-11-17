import type { MaintenanceType } from './maintenance';

export type ReminderCriteria = 'due_date' | 'due_kilometers';

export type ReminderStatus = 'pending' | 'notified' | 'completed' | 'cancelled';

export interface SmartReminder {
  id: string;
  vehicleId: string;
  createdById: string;
  maintenanceTypeId: string | null;
  maintenanceType: MaintenanceType | null;
  title: string;
  description: string | null;
  criteria: ReminderCriteria;
  dueDate: string | null;
  dueKilometers: number | null;
  leadDays: number;
  leadKilometers: number;
  recurring: boolean;
  recurrenceDays: number | null;
  recurrenceKm: number | null;
  status: ReminderStatus;
  lastNotifiedAt: string | null;
}
