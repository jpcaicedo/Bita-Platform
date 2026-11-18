import type { OwnerVehicle } from '@/types/garaje';
import type { MaintenanceStatusItem } from '@/types/maintenance';
import type { SmartReminder } from '@/types/reminder';
import { bitaFetch, type BitaResponse } from './bita-api';
import { groupReminders, type ReminderItem } from './reminders';
import { diasHasta, formatMiles } from './garaje-formato';

/**
 * Lecturas del módulo del dueño (frente B). Igual que lib/taller.ts:
 * usan bitaFetch, así que solo corren en el servidor, y devuelven el
 * status para que cada página decida qué mostrar.
 *
 * El historial, el estado y los tipos de mantenimiento se reutilizan de
 * lib/taller.ts (getVehicleHistory, getVehicleHealth, getMaintenanceTypes).
 */
export function getMyVehicles(): Promise<BitaResponse<OwnerVehicle[]>> {
  return bitaFetch<OwnerVehicle[]>('/vehicles');
}

export function getMyVehicle(
  vehicleId: string,
): Promise<BitaResponse<OwnerVehicle>> {
  return bitaFetch<OwnerVehicle>(`/vehicles/${vehicleId}`);
}

// ------------------------------------------------------------------
// Semáforo del garaje
// ------------------------------------------------------------------

const PESO: Record<MaintenanceStatusItem['status'], number> = {
  up_to_date: 0,
  upcoming: 1,
  overdue: 2,
};

// El estado del vehículo es el de su mantenimiento más urgente.
export function masUrgente(
  items: MaintenanceStatusItem[],
): MaintenanceStatusItem | null {
  if (items.length === 0) return null;

  return [...items].sort((a, b) => PESO[b.status] - PESO[a.status])[0];
}

// La alerta preventiva sale de lo más urgente entre los mantenimientos
// (estado por tipo) y los recordatorios del dueño. Así un recordatorio
// próximo o vencido aparece en la ficha sin tener que entrar a buscarlo.
export type AlertaGaraje =
  | {
      origen: 'mantenimiento';
      status: MaintenanceStatusItem['status'];
      item: MaintenanceStatusItem;
    }
  | {
      origen: 'recordatorio';
      status: MaintenanceStatusItem['status'];
      item: ReminderItem;
    };

// El recordatorio activo más urgente (groupReminders ya los ordena:
// vencidos, próximos y al día). Los completados no cuentan.
export function recordatorioMasUrgente(
  reminders: SmartReminder[],
  currentKilometers: number,
  hoy: string,
): ReminderItem | null {
  return groupReminders(reminders, currentKilometers, hoy).active[0] ?? null;
}

export function elegirAlerta(
  mantenimiento: MaintenanceStatusItem | null,
  recordatorio: ReminderItem | null,
): AlertaGaraje | null {
  const deMantenimiento: AlertaGaraje | null = mantenimiento
    ? {
        origen: 'mantenimiento',
        status: mantenimiento.status,
        item: mantenimiento,
      }
    : null;

  const deRecordatorio: AlertaGaraje | null = recordatorio
    ? {
        origen: 'recordatorio',
        status:
          recordatorio.health === 'overdue' ||
          recordatorio.health === 'upcoming'
            ? recordatorio.health
            : 'up_to_date',
        item: recordatorio,
      }
    : null;

  if (!deRecordatorio) return deMantenimiento;
  if (!deMantenimiento) return deRecordatorio;

  // Si empatan, gana el mantenimiento (trae km y fecha calculados).
  return PESO[deRecordatorio.status] > PESO[deMantenimiento.status]
    ? deRecordatorio
    : deMantenimiento;
}

export function etiquetaEstado(
  status: MaintenanceStatusItem['status'] | null,
): string {
  if (status === 'overdue') return 'Vencido';
  if (status === 'upcoming') return 'Próximo';
  if (status === 'up_to_date') return 'Al día';
  return 'Sin registros';
}

// Porcentaje recorrido hacia el próximo servicio, para la barra.
export function progresoServicio(
  item: MaintenanceStatusItem,
  currentKilometers: number,
): number {
  if (item.status === 'overdue') return 100;

  const { dueKilometers } = item.nextMaintenance;

  if (dueKilometers !== null && dueKilometers > item.lastKilometers) {
    const recorrido = currentKilometers - item.lastKilometers;
    const total = dueKilometers - item.lastKilometers;
    return Math.max(0, Math.min(100, Math.round((recorrido / total) * 100)));
  }

  // Sin meta de kilómetros: mostramos la barra según el estado.
  return item.status === 'upcoming' ? 85 : 40;
}

// "En 1,750 km", "Pasado por 300 km", "En 12 días" o "Venció hace 5 días".
export function textoVencimiento(
  item: MaintenanceStatusItem,
  currentKilometers: number,
): string {
  const { dueKilometers, dueDate } = item.nextMaintenance;

  return textoMeta(dueKilometers, dueDate, currentKilometers);
}

// Lo mismo, pero para la alerta (mantenimiento o recordatorio).
export function textoVencimientoAlerta(
  alerta: AlertaGaraje,
  currentKilometers: number,
): string {
  if (alerta.origen === 'mantenimiento') {
    return textoVencimiento(alerta.item, currentKilometers);
  }

  const { dueKilometers, dueDate } = alerta.item.reminder;

  return textoMeta(dueKilometers, dueDate, currentKilometers);
}

// Nombre que se muestra: el tipo de mantenimiento o el título del recordatorio.
export function nombreAlerta(alerta: AlertaGaraje): string {
  return alerta.origen === 'mantenimiento'
    ? alerta.item.maintenanceType.name
    : alerta.item.reminder.title;
}

// Barra de la alerta. Los recordatorios no guardan desde dónde se cuenta,
// así que su barra va por estado: vencido llena, próximo casi llena,
// al día a la mitad.
export function progresoAlerta(
  alerta: AlertaGaraje,
  currentKilometers: number,
): number {
  if (alerta.origen === 'mantenimiento') {
    return progresoServicio(alerta.item, currentKilometers);
  }

  if (alerta.status === 'overdue') return 100;
  if (alerta.status === 'upcoming') return 85;
  return 40;
}

function textoMeta(
  dueKilometers: number | null,
  dueDate: string | null,
  currentKilometers: number,
): string {
  if (dueKilometers !== null) {
    const faltan = dueKilometers - currentKilometers;
    return faltan > 0
      ? `En ${formatMiles(faltan)} km`
      : `Pasado por ${formatMiles(-faltan)} km`;
  }

  if (dueDate !== null) {
    const dias = diasHasta(dueDate);
    if (dias > 0) return `En ${dias} días`;
    if (dias === 0) return 'Vence hoy';
    return `Venció hace ${-dias} días`;
  }

  return 'Sin próxima fecha';
}
