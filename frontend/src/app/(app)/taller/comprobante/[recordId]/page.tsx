import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  ArrowRightIcon,
  CheckIcon,
  DocumentIcon,
} from '@/components/ui/icons';
import { requireWorkshop } from '@/lib/session';
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
  title: 'Servicio registrado',
};

export default function ComprobantePage({
  params,
  searchParams,
}: {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<{ vehiculo?: string }>;
}) {
  return (
    <Suspense fallback={<ReceiptSkeleton />}>
      <ReceiptContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function ReceiptContent({
  params,
  searchParams,
}: {
  params: Promise<{ recordId: string }>;
  searchParams: Promise<{ vehiculo?: string }>;
}) {
  const [{ recordId }, query, session] = await Promise.all([
    params,
    searchParams,
    requireWorkshop(),
  ]);

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
        <h3>No encontramos el comprobante</h3>
        <p>
          El servicio pudo guardarse, pero no logramos leer su detalle. Busca el
          vehículo en el historial para confirmarlo.
        </p>
        <div className="g-state-actions">
          <Link href="/taller/vehiculos" className="g-btn g-btn--primary">
            Ir al historial
          </Link>
        </div>
      </section>
    );
  }

  const observaciones = parseObservaciones(record.observations);
  const costo = formatCosto(record.cost, record.observations);
  const healthItem = health?.data?.find(
    (item) => item.maintenanceType.id === record.maintenanceTypeId,
  );

  return (
    <>
      <section className="g-receipt-hero">
        <span className="g-receipt-check" aria-hidden="true">
          <CheckIcon size={36} />
        </span>
        <h2>Servicio registrado</h2>
        <p>
          El mantenimiento quedó guardado en la bitácora de{' '}
          <strong>{item?.vehicle.plate ?? 'el vehículo'}</strong>.
        </p>
      </section>

      <section className="g-card g-receipt-card">
        <div className="g-receipt-head">
          <strong>{record.maintenanceType.name}</strong>
          <span className="g-pill g-pill--green">Guardado</span>
        </div>

        <dl className="g-receipt-list">
          <div className="g-receipt-row">
            <dt>Vehículo</dt>
            <dd>
              {item
                ? `${item.vehicle.brand} ${item.vehicle.model} · ${item.vehicle.plate}`
                : 'Vehículo autorizado'}
            </dd>
          </div>
          <div className="g-receipt-row">
            <dt>Fecha</dt>
            <dd>{formatFecha(record.serviceDate)}</dd>
          </div>
          <div className="g-receipt-row">
            <dt>Kilometraje</dt>
            <dd>{formatKilometros(record.kilometers)}</dd>
          </div>
          <div className="g-receipt-row">
            <dt>Costo</dt>
            <dd>{costo ?? 'No registrado'}</dd>
          </div>
          <div className="g-receipt-row">
            <dt>Taller</dt>
            <dd>{session.workshop?.name ?? 'Tu taller'}</dd>
          </div>
        </dl>

        {observaciones && (
          <div className="g-obs-block">
            <h4>Detalle del servicio</h4>
            <div className="g-obs-list">
              {observaciones.map((linea) => (
                <div key={linea.label}>
                  <span className="g-obs-label">{linea.label}</span>
                  <span className="g-obs-value">{linea.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {record.observations && !observaciones && (
          <div className="g-obs-block">
            <h4>Observaciones</h4>
            <p>{record.observations}</p>
          </div>
        )}

        {healthItem && (
          <div className="g-next-card">
            <p>
              Próximo {record.maintenanceType.name.toLowerCase()} según el
              intervalo del catálogo:
            </p>
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
            href={`/taller/vehiculos/${item.vehicle.id}`}
            className="g-btn g-btn--primary"
          >
            Ver historial del vehículo
            <ArrowRightIcon size={18} />
          </Link>
        )}
        <Link
          href={`/taller/registrar/${vehicleId}`}
          className="g-btn g-btn--outline"
        >
          Registrar otro servicio
        </Link>
        <Link href="/taller" className="g-btn g-btn--soft">
          Volver a recepción
        </Link>
      </div>
    </>
  );
}

function ReceiptSkeleton() {
  return (
    <>
      <div className="g-skeleton g-receipt-check" />
      <div className="g-skeleton g-taller-skeleton-head" />
      <div className="g-skeleton g-taller-skeleton-tall" />
    </>
  );
}
