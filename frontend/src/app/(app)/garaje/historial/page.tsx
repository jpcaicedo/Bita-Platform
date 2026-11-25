import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { GarageIcon } from '@/components/garaje/garage-icon';
import { getMyVehicles } from '@/lib/garaje';
import { estiloTipo, formatMiles, separarTaller } from '@/lib/garaje-formato';
import { formatCosto, formatFecha, getVehicleHistory } from '@/lib/taller';

export const metadata: Metadata = {
  title: 'Historial',
};

// Historial de todos los servicios de todos los vehículos del dueño,
// del más reciente al más antiguo. Es el botón "Historial" del menú.
export default function OwnerHistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <OwnerHistoryContent />
    </Suspense>
  );
}

async function OwnerHistoryContent() {
  const vehicles = await getMyVehicles();

  if (!vehicles.ok || !vehicles.data) {
    return (
      <section className="g-garage-state" style={{ marginTop: 62 }}>
        <h3>No pudimos cargar el historial</h3>
        <p>El servidor no respondió. Inténtalo de nuevo en unos segundos.</p>
        <Link href="/garaje/historial" className="g-btn g-btn--outline">
          Reintentar
        </Link>
      </section>
    );
  }

  const lista = vehicles.data;

  // El historial de cada vehículo se pide al mismo tiempo.
  const historiales = await Promise.all(
    lista.map((vehicle) => getVehicleHistory(vehicle.id)),
  );

  // Une todos los registros con su vehículo y los ordena por fecha.
  const registros = lista
    .flatMap((vehicle, index) =>
      (historiales[index].ok ? (historiales[index].data ?? []) : []).map(
        (record) => ({ record, vehicle }),
      ),
    )
    .sort((a, b) => b.record.serviceDate.localeCompare(a.record.serviceDate));

  const inversion = registros.reduce(
    (sum, { record }) => sum + (record.cost ?? 0),
    0,
  );

  return (
    <>
      <header className="g-garage-greeting">
        <div>
          <h2>Historial</h2>
          <p>Todos los servicios de tus vehículos en un solo lugar.</p>
        </div>
      </header>

      <div className="g-garage-section">
        <h3>Servicios</h3>
        <span className="g-garage-count">{registros.length}</span>
      </div>

      {registros.length > 0 && (
        <p className="g-garage-history-total">
          Inversión total: <strong>{formatCosto(inversion, null)}</strong>
        </p>
      )}

      {registros.length === 0 ? (
        <section className="g-garage-state">
          <h3>Aún no hay servicios</h3>
          <p>
            Cuando registres un mantenimiento en alguno de tus vehículos,
            aparecerá aquí.
          </p>
          <Link href="/garaje" className="g-btn g-btn--primary">
            Ir a mis autos
          </Link>
        </section>
      ) : (
        <div className="g-garage-records">
          {registros.map(({ record, vehicle }) => {
            const estilo = estiloTipo(record.maintenanceType.name);
            const costo = formatCosto(record.cost, record.observations);
            const { taller } = separarTaller(record.observations);

            return (
              <article key={record.id} className="g-garage-record">
                <div className="g-garage-record-head">
                  <div className="g-garage-record-main">
                    <span
                      className="g-garage-record-icon"
                      style={{ background: estilo.fondo, color: estilo.color }}
                    >
                      <GarageIcon name={estilo.icono} width={18} height={17} />
                    </span>
                    <div>
                      <h3>{record.maintenanceType.name}</h3>
                      <p className="g-garage-record-meta">
                        <GarageIcon
                          name="fecha-mini"
                          width={10.5}
                          height={11.7}
                        />
                        {formatFecha(record.serviceDate)} ·{' '}
                        {formatMiles(record.kilometers)} km
                      </p>
                    </div>
                  </div>
                  {costo && (
                    <span className="g-garage-record-cost">{costo}</span>
                  )}
                </div>

                <div className="g-garage-record-foot">
                  <Link
                    href={`/garaje/${vehicle.id}`}
                    className="g-garage-record-shop"
                  >
                    {vehicle.brand} {vehicle.model} · {vehicle.plate}
                  </Link>
                  <span className="g-garage-record-status">
                    {taller ??
                      (record.workshopId ? 'Taller' : 'Registrado por ti')}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}

function HistorySkeleton() {
  return (
    <div aria-busy="true" style={{ paddingTop: 57 }}>
      <div
        className="g-skeleton"
        style={{ height: 36, width: '45%', marginBottom: 8 }}
      />
      <div
        className="g-skeleton"
        style={{ height: 20, width: '80%', marginBottom: 32 }}
      />
      <div className="g-garage-records">
        <div className="g-skeleton g-garage-skeleton" style={{ height: 125 }} />
        <div className="g-skeleton g-garage-skeleton" style={{ height: 125 }} />
      </div>
    </div>
  );
}
