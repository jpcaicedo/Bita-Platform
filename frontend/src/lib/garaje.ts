import type { OwnerVehicle } from '@/types/garaje';
import type { MaintenanceStatusItem } from '@/types/maintenance';
import { bitaFetch, type BitaResponse } from './bita-api';
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
