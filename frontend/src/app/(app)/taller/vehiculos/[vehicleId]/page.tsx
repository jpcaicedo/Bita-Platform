import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  DocumentIcon,
  ShieldIcon,
} from '@/components/ui/icons';
import {
  detalleVencimiento,
  estadoMantenimiento,
  formatCosto,
  formatFecha,
  formatKilometros,
  getAuthorizedVehicles,
  getVehicleHealth,
  getVehicleHistory,
} from '@/lib/taller';
import { resumenObservaciones } from '@/lib/taller-observaciones';

export const metadata: Metadata = {
  title: 'Detalle del vehículo',
};

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  return (
    <Suspense fallback={<VehicleDetailSkeleton />}>
      <VehicleDetailContent params={params} />
    </Suspense>
  );
}

async function VehicleDetailContent({
  params,
}: {
  params: Promise<{ vehicleId: string }>;
}) {
  const { vehicleId } = await params;
  const [vehicles, history, health] = await Promise.all([
    getAuthorizedVehicles(),
    getVehicleHistory(vehicleId),
    getVehicleHealth(vehicleId),
  ]);

  const item = vehicles.data?.find(
    (authorized) => authorized.vehicle.id === vehicleId,
  );

  if (!item) {
    return (
      <section className="g-card g-state-card g-state-card--alert">
        <span className="g-state-icon" aria-hidden="true">
          <ShieldIcon size={26} />
        </span>
        <h3>Sin acceso al vehículo</h3>
        <p>
          Este vehículo no está entre tus autorizaciones activas. Si el dueño te
          dio acceso hace poco, vuelve a intentarlo.
        </p>
        <div className="g-state-actions">
          <Link href="/taller/vehiculos" className="g-btn g-btn--outline">
            Volver al historial
          </Link>
        </div>
      </section>
    );
  }

  if (!item.canRead) {
    return (
      <section className="g-card g-state-card">
        <span className="g-state-icon" aria-hidden="true">
          <ShieldIcon size={26} />
        </span>
        <h3>Lectura restringida</h3>
        <p>
          El dueño autorizó a tu taller para registrar servicios, pero no para
          ver el historial ni el kilometraje.
        </p>
        <div className="g-state-actions">
          {item.canWrite && (
            <Link
              href={`/taller/registrar/${vehicleId}`}
              className="g-btn g-btn--primary"
            >
              Registrar servicio
            </Link>
          )}
        </div>
      </section>
    );
  }

  const { vehicle } = item;
  const records = history.ok ? history.data ?? [] : [];
  const healthItems = health.ok ? health.data ?? [] : [];

  return (
    <>
      <section className="g-card g-vehicle-detail-head">
        <span className="g-vehicle-plate">{vehicle.plate}</span>
        <span className="g-vehicle-strip-info">
          <strong>
            {vehicle.brand} {vehicle.model}
          </strong>
          <span>
            {vehicle.year ?? 'Año no registrado'} ·{' '}
            {formatKilometros(vehicle.currentKilometers)}
          </span>
          {!item.canWrite && (
            <span className="g-pill g-pill--lilac">Solo lectura</span>
          )}
        </span>
      </section>

      <div className="g-detail-actions">
        {item.canWrite && (
          <Link
            href={`/taller/registrar/${vehicleId}`}
            className="g-btn g-btn--primary"
          >
            Registrar servicio
            <ArrowRightIcon size={18} />
          </Link>
        )}
      </div>

      {!history.ok && (
        <p className="g-alert g-alert--error" role="alert">
          No pudimos cargar el historial de este vehículo.
        </p>
      )}

      {healthItems.length > 0 && (
        <section className="g-card g-health-card">
          <h3>Próximos mantenimientos</h3>
          <div className="g-health-list">
            {healthItems.map((healthItem) => {
              const estado = estadoMantenimiento(healthItem.status);

              return (
                <div
                  key={healthItem.maintenanceType.id}
                  className={`g-health-item g-health-item--${healthItem.status}`}
                >
                  <span className="g-health-info">
                    <strong>{healthItem.maintenanceType.name}</strong>
                    <span>{detalleVencimiento(healthItem)}</span>
                  </span>
                  <span className={`g-pill ${estado.className}`}>
                    {estado.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="g-taller-section">
        <div className="g-taller-section-head">
          <h3>Historial de servicios</h3>
          <span>{records.length} registros</span>
        </div>

        {records.length > 0 ? (
          <div className="g-timeline">
            {records.map((record) => {
              const note = resumenObservaciones(record.observations);
              const cost = formatCosto(record.cost, record.observations);

              return (
                <article key={record.id} className="g-card g-timeline-card">
                  <div className="g-timeline-head">
                    <strong>{record.maintenanceType.name}</strong>
                    <span>{formatFecha(record.serviceDate)}</span>
                  </div>

                  <div className="g-timeline-meta">
                    <span>{formatKilometros(record.kilometers)}</span>
                    {cost && <span>·</span>}
                    {cost && <span>{cost}</span>}
                  </div>

                  {note && <p className="g-timeline-note">{note}</p>}

                  <Link
                    href={`/taller/servicio/${record.id}?vehiculo=${vehicleId}`}
                    className="g-timeline-link"
                  >
                    Ver detalle
                    <ChevronRightIcon size={14} />
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="g-card g-empty">
            <span className="g-state-icon" aria-hidden="true">
              <DocumentIcon size={24} />
            </span>
            <p>Todavía no hay servicios registrados para este vehículo.</p>
          </div>
        )}
      </section>
    </>
  );
}

function VehicleDetailSkeleton() {
  return (
    <>
      <div className="g-skeleton g-taller-skeleton-card" />
      <div className="g-skeleton g-taller-skeleton-text" />
      <div className="g-skeleton g-taller-skeleton-tall" />
      <div className="g-skeleton g-taller-skeleton-card" />
    </>
  );
}
