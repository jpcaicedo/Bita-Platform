import type { SmartReminder } from './reminder';
import type { VehicleSummary } from './vehicle';

// ReminderNotificationEntity tal como la devuelve GET /notifications,
// con el recordatorio y su vehículo incluidos.
export interface ReminderNotification {
  id: string;
  reminderId: string;
  notificationType: 'upcoming' | 'overdue';
  scheduledFor: string;
  readAt: string | null;
  reminder: SmartReminder & { vehicle: VehicleSummary };
}
