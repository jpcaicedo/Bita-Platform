import type { VehicleSummary } from './vehicle';

// Perfil de taller: su existencia determina el rol del usuario.
export interface WorkshopProfile {
  id: string;
  userId: string;
  name: string;
  businessName: string | null;
  identification: string | null;
  createdAt: string;
}

export interface WorkshopVehicle {
  authorizationId: string;
  canRead: boolean;
  canWrite: boolean;
  vehicle: VehicleSummary;
}

export interface WorkshopAuthorizationSummary {
  id: string;
  canRead: boolean;
  canWrite: boolean;
  status: string;
}

// Respuesta de GET /workshops/vehicles/plate/:plate.
export interface WorkshopPlateResult {
  vehicle: VehicleSummary;
  authorization: WorkshopAuthorizationSummary | null;
}
