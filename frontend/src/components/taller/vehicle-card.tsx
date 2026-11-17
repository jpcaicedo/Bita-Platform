import Link from 'next/link';
import { ChevronRightIcon } from '@/components/ui/icons';
import { formatKilometros } from '@/lib/taller';
import type { WorkshopVehicle } from '@/types/workshop';

interface VehicleCardProps {
  item: WorkshopVehicle;
}

// Tarjeta compartida por la recepción y la lista de vehículos autorizados.
export function VehicleCard({ item }: VehicleCardProps) {
  const { vehicle } = item;
  const year = vehicle.year ? String(vehicle.year) : 'Año no registrado';
  const access = item.canWrite
    ? { label: 'Puede registrar', className: 'g-pill--green' }
    : { label: 'Solo lectura', className: 'g-pill--lilac' };

  const body = (
    <>
      <span className="g-vehicle-plate">{vehicle.plate}</span>

      <span className="g-vehicle-card-body">
        <strong>
          {vehicle.brand} {vehicle.model}
        </strong>
        <span className="g-vehicle-meta">
          {year}
          <span aria-hidden="true">·</span>
          {formatKilometros(vehicle.currentKilometers)}
        </span>
        <span className={`g-pill ${access.className}`}>{access.label}</span>
      </span>

      <span className="g-vehicle-chevron" aria-hidden="true">
        <ChevronRightIcon size={20} />
      </span>
    </>
  );

  if (!item.canRead) {
    return <article className="g-card g-vehicle-card">{body}</article>;
  }

  return (
    <Link
      href={`/taller/vehiculos/${vehicle.id}`}
      className="g-card g-vehicle-card"
    >
      {body}
    </Link>
  );
}
