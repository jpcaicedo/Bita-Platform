import type { VehicleSummary } from './vehicle';

// Mismos valores que FUEL_TYPES en vehicle.entity.ts del backend.
export type FuelType = 'gasolina' | 'diesel' | 'hibrido' | 'electrico';

// Vehículo completo que recibe el dueño en GET /vehicles y GET /vehicles/:id.
// Extiende el tipo que ya creó el frente A para no duplicarlo.
export interface OwnerVehicle extends VehicleSummary {
  ownerId: string;
  currentKilometers: number;
  fuelType: FuelType | null;
  createdAt: string;
  updatedAt: string;
}
