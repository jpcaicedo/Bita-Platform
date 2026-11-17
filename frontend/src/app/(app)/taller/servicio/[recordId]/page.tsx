import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRightIcon, DocumentIcon } from '@/components/ui/icons';
import {
  detalleVencimiento,
  estadoMantenimiento,
  findRecord,
  formatCosto,
  formatFecha,
  formatKilometros,
  getAuthorizedVehicles,
  getVehicleHealth,
} from '@/lib/taller';
import { parseObservaciones } from '@/lib/taller-observaciones';

export const metadata: Metadata = {
  title: 'Detalle del servicio',
};

export default function ServicioPage({
  params,
  searchParams,
}: {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<{ vehiculo?: string }>;
}) {
  return (
    <Suspense fallback={<ServiceSkeleton />}>
      <ServiceContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ServiceContent({
  params,
  searchParams,
}: {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<{ vehiculo?: string }>;
}) {
  const [{ recordId }, query] = await Promise.all([params, searchParams]);
  const vehicleId = query.vehiculo;

  const [record, vehicles, health] = await Promise.all([
    vehicleId ? findRecord(vehicleId, recordId) : Promise.resolve(null),
    getAuthorizedVehicles(),
    vehicleId ? getVehicleHealth(vehicleId) : Promise.resolve(null),
  ]);

  const item = vehicles.data?.find(
    (authorized) => authorized.vehicle.id === vehicleId,
  );

  if (!vehicleId || !record) {
    return (
      <section className="g-card g-state-card">
        <span className="g-state-icon" aria-hidden="true">
          <DocumentIcon size={26} />
        </span>
        <h3>No encontramos el servicio</h3>
        <p>
          El registro ya no está disponible o el vehículo no tiene historial
          compartido con tu taller.
        </p>
        <div className="g-state-actions">
          <Link href="/taller/vehiculos" className="g-btn g-btn--outline">
            Volver al historial
          </Link>
        </div>
      </section>
    );
  }

  const observaciones = parseObservaciones(record.observations);
  const costo = formatCosto(record.cost, record.observations);
  const healthItem = health?.data?.find(
    (entry) => entry.maintenanceType.id === record.maintenanceTypeId,
  );

  return (
    <>
      <header className="g-taller-head">
        <h2>{record.maintenanceType.name}</h2>
        <p>
          {formatFecha(record.serviceDate)} ·{' '}
          {formatKilometros(record.kilometers)}
        </p>
      </header>

      {item && (
        <div className="g-vehicle-strip">
          <span className="g-vehicle-plate">{item.vehicle.plate}</span>
          <span className="g-vehicle-strip-info">
            <strong>
              {item.vehicle.brand} {item.vehicle.model}
            </strong>
            <span>{item.vehicle.year ?? 'Año no registrado'}</span>
          </span>
        </div>
      )}

      <section className="g-card g-receipt-card">
        <div className="g-receipt-head">
          <strong>Resumen del servicio</strong>
          <span className="g-pill g-pill--blue">Registro</span>
        </div>

        <dl className="g-receipt-list">
          {costo && (
            <div className="g-receipt-row">
              <dt>Costo</dt>
              <dd>{costo}</dd>
            </div>
          )}
          <div className="g-receipt-row">
            <dt>Kilometraje</dt>
            <dd>{formatKilometros(record.kilometers)}</dd>
          </div>
          <div className="g-receipt-row">
            <dt>Registrado</dt>
            <dd>{formatFecha(record.createdAt.slice(0, 10))}</dd>
          </div>
        </dl>

        {observaciones ? (
          <div className="g-obs-block">
            <h4>Detalle del trabajo</h4>
            <div className="g-obs-list">
              {observaciones.map((linea) => (
                <div key={linea.label}>
                  <span className="g-obs-label">{linea.label}</span>
                  <span className="g-obs-value">{linea.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : record.observations ? (
          <div className="g-obs-block">
            <h4>Observaciones</h4>
            <p>{record.observations}</p>
          </div>
        ) : (
          <p className="g-help">Este servicio no tiene observaciones.</p>
        )}

        {healthItem && (
          <div className="g-next-card">
            <p>Próximo {record.maintenanceType.name.toLowerCase()}:</p>
            <strong>{detalleVencimiento(healthItem)}</strong>
            <span
              className={`g-pill ${estadoMantenimiento(healthItem.status).className}`}
            >
              {estadoMantenimiento(healthItem.status).label}
            </span>
          </div>
        )}
      </section>

      <div className="g-receipt-actions">
        {item && (
          <Link
            href={`/taller/vehiculos/${vehicleId}`}
            className="g-btn g-btn--primary"
          >
            Volver al historial
            <ArrowRightIcon size={18} />
          </Link>
        )}
        {item?.canWrite && (
          <Link
            href={`/taller/registrar/${vehicleId}`}
            className="g-btn g-btn--outline"
          >
            Registrar otro servicio
          </Link>
        )}
      </div>
    </>
  );
}

function ServiceSkeleton() {
  return (
    <>
      <div className="g-skeleton g-taller-skeleton-head" />
      <div className="g-skeleton g-taller-skeleton-text" />
      <div className="g-skeleton g-taller-skeleton-card" />
      <div className="g-skeleton g-taller-skeleton-tall" />
    </>
  );
}
