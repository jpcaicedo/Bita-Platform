// Lo mínimo que el front usa de GET /vehicles/:id y de la recepción del taller.
export interface VehicleSummary {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number | null;
  currentKilometers: number | null;
}
