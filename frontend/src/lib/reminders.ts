import type { ReminderCriteria, SmartReminder } from '@/types/reminder';
import { bitaFetch, type BitaResponse } from './bita-api';
import { formatMiles } from './garaje-formato';
import { formatFecha } from './taller';

export type ReminderHealth =
  | 'overdue'
  | 'upcoming'
  | 'on_track'
  | 'completed'
  | 'cancelled';

export interface ReminderItem {
  reminder: SmartReminder;
  health: ReminderHealth;
}

export interface ReminderGroups {
  active: ReminderItem[];
  closed: ReminderItem[];
  overdue: number;
  upcoming: number;
  onTrack: number;
}

export interface CreateReminderBody {
  title: string;
  criteria: ReminderCriteria;
  description?: string;
  maintenanceTypeId?: string;
  dueDate?: string;
  dueKilometers?: number;
  leadDays?: number;
  leadKilometers?: number;
  recurring?: boolean;
  recurrenceDays?: number;
  recurrenceKm?: number;
}

const HEALTH_ORDER: Record<ReminderHealth, number> = {
  overdue: 0,
  upcoming: 1,
  on_track: 2,
  completed: 3,
  cancelled: 4,
};

export function getVehicleReminders(
  vehicleId: string,
): Promise<BitaResponse<SmartReminder[]>> {
  return bitaFetch<SmartReminder[]>(`/vehicles/${vehicleId}/reminders`);
}

export function createReminder(
  vehicleId: string,
  body: CreateReminderBody,
): Promise<BitaResponse<SmartReminder>> {
  return bitaFetch<SmartReminder>(`/vehicles/${vehicleId}/reminders`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function completeReminder(
  reminderId: string,
  body: { kilometers?: number },
): Promise<BitaResponse<SmartReminder>> {
  return bitaFetch<SmartReminder>(`/reminders/${reminderId}/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function findReminder(
  vehicleId: string,
  reminderId: string,
): Promise<SmartReminder | null> {
  const result = await getVehicleReminders(vehicleId);

  if (!result.ok || !result.data) return null;

  return result.data.find((reminder) => reminder.id === reminderId) ?? null;
}

function km(value: number): string {
  return `${formatMiles(value)} km`;
}

function daysUntil(isoDate: string, today: string): number {
  const target = Date.parse(`${isoDate.slice(0, 10)}T00:00:00Z`);
  const base = Date.parse(`${today}T00:00:00Z`);

  return Math.round((target - base) / 86400000);
}

export function evaluateReminder(
  reminder: SmartReminder,
  currentKilometers: number,
  today: string,
): ReminderHealth {
  if (reminder.status === 'completed') return 'completed';
  if (reminder.status === 'cancelled') return 'cancelled';

  if (
    reminder.dueKilometers !== null &&
    currentKilometers >= reminder.dueKilometers
  ) {
    return 'overdue';
  }

  if (reminder.dueDate !== null && daysUntil(reminder.dueDate, today) <= 0) {
    return 'overdue';
  }

  if (
    reminder.dueKilometers !== null &&
    reminder.dueKilometers - currentKilometers <= reminder.leadKilometers
  ) {
    return 'upcoming';
  }

  if (
    reminder.dueDate !== null &&
    daysUntil(reminder.dueDate, today) <= reminder.leadDays
  ) {
    return 'upcoming';
  }

  return 'on_track';
}

export function groupReminders(
  reminders: SmartReminder[],
  currentKilometers: number,
  today: string,
): ReminderGroups {
  const items: ReminderItem[] = reminders.map((reminder) => ({
    reminder,
    health: evaluateReminder(reminder, currentKilometers, today),
  }));

  const isClosed = (item: ReminderItem) =>
    item.health === 'completed' || item.health === 'cancelled';

  const active = items
    .filter((item) => !isClosed(item))
    .sort((a, b) => HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health]);

  return {
    active,
    closed: items.filter(isClosed),
    overdue: active.filter((item) => item.health === 'overdue').length,
    upcoming: active.filter((item) => item.health === 'upcoming').length,
    onTrack: active.filter((item) => item.health === 'on_track').length,
  };
}

export function reminderPill(health: ReminderHealth): {
  label: string;
  pill: string;
  tone: 'ok' | 'upcoming' | 'overdue' | 'closed';
} {
  if (health === 'overdue') {
    return { label: 'Vencido', pill: 'g-pill--alert', tone: 'overdue' };
  }

  if (health === 'upcoming') {
    return { label: 'Próximo', pill: 'g-pill--lilac', tone: 'upcoming' };
  }

  if (health === 'completed') {
    return { label: 'Completado', pill: 'g-pill--blue', tone: 'closed' };
  }

  if (health === 'cancelled') {
    return { label: 'Cancelado', pill: 'g-pill--blue', tone: 'closed' };
  }

  return { label: 'Al día', pill: 'g-pill--green', tone: 'ok' };
}

function describeDays(days: number): string {
  if (days > 1) return `en ${days} días`;
  if (days === 1) return 'mañana';
  if (days === 0) return 'vence hoy';
  if (days === -1) return 'venció ayer';

  return `venció hace ${Math.abs(days)} días`;
}

export function describeReminder(
  reminder: SmartReminder,
  currentKilometers: number,
  today: string,
): string[] {
  const lines: string[] = [];

  if (reminder.dueKilometers !== null) {
    const remaining = reminder.dueKilometers - currentKilometers;
    const detail =
      remaining > 0
        ? `faltan ${km(remaining)}`
        : remaining === 0
          ? 'kilometraje alcanzado'
          : `superado por ${km(Math.abs(remaining))}`;

    lines.push(`${km(reminder.dueKilometers)} · ${detail}`);
  }

  if (reminder.dueDate !== null) {
    lines.push(
      `${formatFecha(reminder.dueDate)} · ${describeDays(
        daysUntil(reminder.dueDate, today),
      )}`,
    );
  }

  return lines;
}

export function describeRecurrence(reminder: SmartReminder): string | null {
  if (!reminder.recurring) return null;

  const parts: string[] = [];

  if (reminder.recurrenceDays !== null) {
    parts.push(`cada ${reminder.recurrenceDays} días`);
  }

  if (reminder.recurrenceKm !== null) {
    parts.push(`cada ${km(reminder.recurrenceKm)}`);
  }

  return parts.length > 0 ? `Se repite ${parts.join(' y ')}` : 'Se repite';
}
