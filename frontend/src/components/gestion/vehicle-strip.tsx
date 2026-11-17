import { formatMiles } from '@/lib/garaje-formato';
import type { OwnerVehicle } from '@/types/garaje';

export function VehicleStrip({ vehicle }: { vehicle: OwnerVehicle }) {
  return (
    <div className="g-gest-vehicle">
      <span className="g-gest-plate">{vehicle.plate}</span>
      <span className="g-gest-vehicle-info">
        <strong>
          {vehicle.brand} {vehicle.model}
        </strong>
        <span>
          {vehicle.year ?? 'Año no registrado'} ·{' '}
          {formatMiles(vehicle.currentKilometers)} km
        </span>
      </span>
    </div>
  );
}
