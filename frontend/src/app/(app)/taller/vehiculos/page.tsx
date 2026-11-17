import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CarIcon, SearchIcon } from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { VehicleCard } from '@/components/taller/vehicle-card';
import { getAuthorizedVehicles } from '@/lib/taller';

export const metadata: Metadata = {
  title: 'Historial',
};

export default function VehiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={<VehiclesSkeleton />}>
      <VehiclesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function VehiclesContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? '';
  const vehicles = await getAuthorizedVehicles();

  const items = (vehicles.data ?? []).filter((item) => {
    if (!query) return true;

    const vehicle = item.vehicle;
    return (
      vehicle.plate.toLowerCase().includes(query) ||
      vehicle.brand.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <header className="g-taller-head">
        <h2>Vehículos autorizados</h2>
        <p>
          Historial de servicios de los vehículos que los dueños compartieron
          con tu taller.
        </p>
      </header>

      <form action="/taller/vehiculos" method="get" className="g-search-form">
        <label htmlFor="vehicle-search" className="g-sr-only">
          Buscar vehículo
        </label>
        <input
          id="vehicle-search"
          className="g-input"
          type="search"
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Placa, marca o modelo"
        />
        <SubmitButton pendingText="…">
          <SearchIcon size={18} />
          <span className="g-sr-only">Buscar</span>
        </SubmitButton>
      </form>

      {!vehicles.ok ? (
        <p className="g-alert g-alert--error" role="alert">
          No pudimos cargar tus vehículos. Inténtalo de nuevo en unos segundos.
        </p>
      ) : items.length > 0 ? (
        <div className="g-vehicle-list">
          {items.map((item) => (
            <VehicleCard key={item.authorizationId} item={item} />
          ))}
        </div>
      ) : (
        <section className="g-card g-empty">
          <span className="g-state-icon" aria-hidden="true">
            <CarIcon size={24} />
          </span>
          <h3>
            {query ? 'Sin coincidencias' : 'Aún no hay vehículos'}
          </h3>
          <p>
            {query
              ? 'Ningún vehículo autorizado coincide con tu búsqueda.'
              : 'Cuando un dueño autorice a tu taller, el vehículo aparecerá aquí.'}
          </p>
          {query && (
            <Link href="/taller/vehiculos" className="g-btn g-btn--outline">
              Ver todos
            </Link>
          )}
        </section>
      )}
    </>
  );
}

function VehiclesSkeleton() {
  return (
    <>
      <div className="g-skeleton g-taller-skeleton-head" />
      <div className="g-skeleton g-taller-skeleton-text" />
      <div className="g-skeleton g-taller-skeleton-card" />
      <div className="g-skeleton g-taller-skeleton-card" />
      <div className="g-skeleton g-taller-skeleton-card" />
    </>
  );
}
