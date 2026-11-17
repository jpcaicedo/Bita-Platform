import type {
  CreatedMaintenance,
  MaintenanceRecord,
  MaintenanceStatusItem,
  MaintenanceType,
} from '@/types/maintenance';
import type {
  WorkshopPlateResult,
  WorkshopVehicle,
} from '@/types/workshop';
import { bitaFetch, type BitaResponse } from './bita-api';
import { parseObservaciones } from './taller-observaciones';

/**
 * Lecturas del módulo de taller. Todas usan la cookie httpOnly a través de
 * bitaFetch, así que solo pueden ejecutarse en el servidor. Las páginas
 * deciden qué mostrar según el status (400 placa inválida, 404 sin vehículo,
 * 403 sin autorización).
 */
export function getAuthorizedVehicles(): Promise<
  BitaResponse<WorkshopVehicle[]>
> {
  return bitaFetch<WorkshopVehicle[]>('/workshops/vehicles');
}

export function searchVehicleByPlate(
  plate: string,
): Promise<BitaResponse<WorkshopPlateResult>> {
  return bitaFetch<WorkshopPlateResult>(
    `/workshops/vehicles/plate/${encodeURIComponent(plate)}`,
    { redirectOn401: false },
  );
}

export function getMaintenanceTypes(): Promise<
  BitaResponse<MaintenanceType[]>
> {
  return bitaFetch<MaintenanceType[]>('/maintenance-types');
}

export function getVehicleHistory(
  vehicleId: string,
): Promise<BitaResponse<MaintenanceRecord[]>> {
  return bitaFetch<MaintenanceRecord[]>(
    `/vehicles/${vehicleId}/maintenance?limit=100`,
    { redirectOn401: false },
  );
}

export function getVehicleHealth(
  vehicleId: string,
): Promise<BitaResponse<MaintenanceStatusItem[]>> {
  return bitaFetch<MaintenanceStatusItem[]>(
    `/vehicles/${vehicleId}/maintenance/status`,
    { redirectOn401: false },
  );
}

export function createMaintenance(
  vehicleId: string,
  body: {
    maintenanceTypeId: string;
    serviceDate: string;
    kilometers: number;
    cost?: number;
    observations?: string;
  },
): Promise<BitaResponse<CreatedMaintenance>> {
  return bitaFetch<CreatedMaintenance>(
    `/workshops/vehicles/${vehicleId}/maintenance`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      redirectOn401: false,
    },
  );
}

// Busca un registro dentro del historial: la API no tiene GET por id.
export async function findRecord(
  vehicleId: string,
  recordId: string,
): Promise<MaintenanceRecord | null> {
  const history = await getVehicleHistory(vehicleId);

  if (!history.ok || !history.data) return null;

  return history.data.find((record) => record.id === recordId) ?? null;
}

// Fecha local de Colombia en formato YYYY-MM-DD (la API rechaza futuros).
export function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
  }).format(new Date());
}

// "16 nov 2026" a partir de la fecha sin hora que devuelve la API.
export function formatFecha(isoDate: string): string {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

// Moneda elegida por el taller, guardada en las observaciones.
function monedaDe(observations: string | null): string {
  const parsed = parseObservaciones(observations);
  return parsed?.find((item) => item.label === 'Moneda')?.value ?? 'COP';
}

export function formatCosto(
  cost: number | null,
  observations: string | null,
): string | null {
  if (cost === null) return null;

  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: monedaDe(observations),
      maximumFractionDigits: 0,
    }).format(cost);
  } catch {
    return `$${new Intl.NumberFormat('es-CO').format(cost)}`;
  }
}

export function formatKilometros(km: number | null): string {
  if (km === null) return 'Kilometraje restringido';

  return `${new Intl.NumberFormat('es-CO').format(km)} km`;
}

// Estado de un mantenimiento para las pastillas de color.
export function estadoMantenimiento(
  status: MaintenanceStatusItem['status'],
): { label: string; className: string } {
  if (status === 'overdue') {
    return { label: 'Vencido', className: 'g-pill--alert' };
  }

  if (status === 'upcoming') {
    return { label: 'Próximo', className: 'g-pill--lilac' };
  }

  return { label: 'Al día', className: 'g-pill--green' };
}

export function detalleVencimiento(item: MaintenanceStatusItem): string {
  const partes: string[] = [];

  if (item.nextMaintenance.dueKilometers !== null) {
    partes.push(formatKilometros(item.nextMaintenance.dueKilometers));
  }

  if (item.nextMaintenance.dueDate !== null) {
    partes.push(formatFecha(item.nextMaintenance.dueDate));
  }

  return partes.length > 0 ? partes.join(' · ') : 'Sin próxima fecha';
}
