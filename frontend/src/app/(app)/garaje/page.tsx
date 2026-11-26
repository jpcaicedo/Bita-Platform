import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { GarageVehicleCard } from '@/components/garaje/vehicle-card';
import { PlusIcon } from '@/components/ui/icons';
import { getMyVehicles, recordatorioMasUrgente } from '@/lib/garaje';
import { getVehicleReminders } from '@/lib/reminders';
import { requireOwner } from '@/lib/session';
import { getVehicleHealth, hoyISO } from '@/lib/taller';

export const metadata: Metadata = {
  title: 'Mi garaje',
};

interface GarageParams {
  nuevo?: string;
}

export default function GaragePage({
  searchParams,
}: {
  searchParams: Promise<GarageParams>;
}) {
  return (
    <Suspense fallback={<GarageSkeleton />}>
      <GarageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function GarageContent({
  searchParams,
}: {
  searchParams: Promise<GarageParams>;
}) {
  const params = await searchParams;
  const [session, vehicles] = await Promise.all([
    requireOwner(),
    getMyVehicles(),
  ]);

  // Nombre para el saludo: el username, o lo que va antes de la @.
  const nombre = session.user.username || session.user.email.split('@')[0];

  const encabezado = (
    <header className="g-garage-greeting">
      <div>
        <h2>Hola, {nombre}</h2>
        <p>Gestiona el estado y mantenimientos de tu garaje al día.</p>
      </div>
      <Link
        href="/garaje/nuevo"
        className="g-garage-quick"
        aria-label="Agregar vehículo"
      >
        <PlusIcon size={22} />
      </Link>
    </header>
  );

  // Estado de error: no se pudo cargar el garaje.
  if (!vehicles.ok || !vehicles.data) {
    return (
      <>
        {encabezado}
        <section className="g-garage-state">
          <h3>No pudimos cargar tu garaje</h3>
          <p>
            El servidor puede estar despertando. Espera unos segundos y vuelve a
            intentarlo.
          </p>
          <Link href="/garaje" className="g-btn g-btn--outline">
            Reintentar
          </Link>
        </section>
      </>
    );
  }

  const lista = vehicles.data;

  // El semáforo y los recordatorios de todos los vehículos se piden al
  // mismo tiempo.
  const [estados, recordatorios] = await Promise.all([
    Promise.all(lista.map((vehicle) => getVehicleHealth(vehicle.id))),
    Promise.all(lista.map((vehicle) => getVehicleReminders(vehicle.id))),
  ]);
  const hoy = hoyISO();

  return (
    <>
      {encabezado}

      {params.nuevo === '1' && (
        <p
          className="g-alert g-alert--ok"
          role="status"
          style={{ marginBottom: 12 }}
        >
          Vehículo guardado correctamente.
        </p>
      )}

      <div className="g-garage-section">
        <h3>Mis Vehículos</h3>
        <span className="g-garage-count">{lista.length}</span>
      </div>

      {/* Estado vacío */}
      {lista.length === 0 ? (
        <section className="g-garage-state">
          <h3>Tu garaje está vacío</h3>
          <p>
            Agrega tu primer vehículo para empezar a controlar sus
            mantenimientos.
          </p>
          <Link href="/garaje/nuevo" className="g-btn g-btn--primary">
            Agregar vehículo
          </Link>
        </section>
      ) : (
        <div className="g-garage-list">
          {lista.map((vehicle, index) => (
            <GarageVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              statusItems={estados[index].ok ? (estados[index].data ?? []) : []}
              reminder={recordatorioMasUrgente(
                recordatorios[index].ok
                  ? (recordatorios[index].data ?? [])
                  : [],
                vehicle.currentKilometers,
                hoy,
              )}
            />
          ))}
        </div>
      )}
    </>
  );
}

function GarageSkeleton() {
  return (
    <div aria-busy="true" style={{ paddingTop: 57 }}>
      <div
        className="g-skeleton"
        style={{ height: 36, width: '55%', marginBottom: 8 }}
      />
      <div
        className="g-skeleton"
        style={{ height: 20, width: '85%', marginBottom: 32 }}
      />
      <div className="g-garage-list">
        <div className="g-skeleton g-garage-skeleton" style={{ height: 234 }} />
        <div className="g-skeleton g-garage-skeleton" style={{ height: 234 }} />
      </div>
    </div>
  );
}
