import type { VehicleSummary } from './vehicle';

// Vehículo completo que recibe el dueño en GET /vehicles y GET /vehicles/:id.
// Extiende el tipo que ya creó el frente A para no duplicarlo.
export interface OwnerVehicle extends VehicleSummary {
  ownerId: string;
  currentKilometers: number;
  createdAt: string;
  updatedAt: string;
}