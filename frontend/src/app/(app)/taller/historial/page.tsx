import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ChevronRightIcon, DocumentIcon } from '@/components/ui/icons';
import { requireWorkshop } from '@/lib/session';
import {
  formatCosto,
  formatFecha,
  formatKilometros,
  getAuthorizedVehicles,
  getVehicleHistory,
} from '@/lib/taller';
import { resumenObservaciones } from '@/lib/taller-observaciones';

export const metadata: Metadata = {
  title: 'Historial del taller',
};

// Los servicios que registró este taller, en todos los vehículos que
// todavía lo tienen autorizado. Es el botón "Historial" del menú del taller.
export default function WorkshopHistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <WorkshopHistoryContent />
    </Suspense>
  );
}

async function WorkshopHistoryContent() {
  const [session, vehicles] = await Promise.all([
    requireWorkshop(),
    getAuthorizedVehicles(),
  ]);

  if (!vehicles.ok || !vehicles.data) {
    return (
      <p className="g-alert g-alert--error" role="alert">
        No pudimos cargar el historial. Inténtalo de nuevo en unos segundos.
      </p>
    );
  }

  // Solo los vehículos que el taller puede leer.
  const conLectura = vehicles.data.filter((item) => item.canRead);

  const historiales = await Promise.all(
    conLectura.map((item) => getVehicleHistory(item.vehicle.id)),
  );

  // Un registro es de este taller si lo registró su usuario (workshopId).
  const registros = conLectura
    .flatMap((item, index) =>
      (historiales[index].ok ? (historiales[index].data ?? []) : [])
        .filter((record) => record.workshopId === session.user.id)
        .map((record) => ({ record, vehicle: item.vehicle })),
    )
    .sort((a, b) => b.record.serviceDate.localeCompare(a.record.serviceDate));

  return (
    <>
      <header className="g-taller-head">
        <h2>Servicios registrados</h2>
        <p>Lo que tu taller ha registrado en los vehículos autorizados.</p>
      </header>

      <section className="g-taller-section">
        <div className="g-taller-section-head">
          <h3>Más recientes</h3>
          <span>
            {registros.length}{' '}
            {registros.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {registros.length > 0 ? (
          <div className="g-timeline">
            {registros.map(({ record, vehicle }) => {
              const note = resumenObservaciones(record.observations);
              const cost = formatCosto(record.cost, record.observations);

              return (
                <article key={record.id} className="g-card g-timeline-card">
                  <div className="g-timeline-head">
                    <strong>{record.maintenanceType.name}</strong>
                    <span>{formatFecha(record.serviceDate)}</span>
                  </div>

                  <div className="g-timeline-meta">
                    <span>
                      {vehicle.plate} · {vehicle.brand} {vehicle.model}
                    </span>
                  </div>
                  <div className="g-timeline-meta">
                    <span>{formatKilometros(record.kilometers)}</span>
                    {cost && <span>·</span>}
                    {cost && <span>{cost}</span>}
                  </div>

                  {note && <p className="g-timeline-note">{note}</p>}

                  <Link
                    href={`/taller/servicio/${record.id}?vehiculo=${vehicle.id}`}
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
            <p>
              Todavía no has registrado servicios. Busca una placa en Recepción
              para empezar.
            </p>
          </div>
        )}
      </section>
    </>
  );
}

function HistorySkeleton() {
  return (
    <>
      <div className="g-skeleton g-taller-skeleton-text" />
      <div className="g-skeleton g-taller-skeleton-card" />
      <div className="g-skeleton g-taller-skeleton-card" />
    </>
  );
}
