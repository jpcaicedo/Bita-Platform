import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthorizationCard } from '@/components/autorizaciones/authorization-card';
import { Stats } from '@/components/gestion/stats';
import {
  CarIcon,
  DocumentIcon,
  LockIcon,
  PlusIcon,
  ShieldIcon,
} from '@/components/ui/icons';
import {
  getVehicleAuthorizations,
  splitAuthorizations,
} from '@/lib/authorizations';
import { getMyVehicles } from '@/lib/garaje';
import { requireOwner } from '@/lib/session';
import '@/components/gestion/gestion.css';

export const metadata: Metadata = {
  title: 'Talleres',
};

type Filtro = 'activas' | 'revocadas' | 'todas';

const FILTROS: { value: Filtro; label: string }[] = [
  { value: 'activas', label: 'Activas' },
  { value: 'revocadas', label: 'Revocadas' },
];

export default function TalleresPage({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  return (
    <Suspense fallback={<WorkshopsSkeleton />}>
      <WorkshopsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function WorkshopsContent({
  searchParams,
}: {
  searchParams: Promise<{ filtro?: string }>;
}) {
  const query = await searchParams;
  await requireOwner();

  const filtro: Filtro =
    query.filtro === 'revocadas' || query.filtro === 'todas'
      ? query.filtro
      : 'activas';

  const vehicles = await getMyVehicles();

  if (!vehicles.ok || !vehicles.data) {
    return (
      <section className="g-gest">
        <p className="g-alert g-alert--error" role="alert">
          No pudimos cargar tus vehículos. Inténtalo de nuevo en unos segundos.
        </p>
      </section>
    );
  }

  const entries = await Promise.all(
    vehicles.data.map(async (vehicle) => {
      const result = await getVehicleAuthorizations(vehicle.id);

      return {
        vehicle,
        failed: !result.ok,
        ...splitAuthorizations(result.ok ? (result.data ?? []) : []),
      };
    }),
  );

  const activeCount = entries.reduce((sum, entry) => sum + entry.active.length, 0);
  const revokedCount = entries.reduce(
    (sum, entry) => sum + entry.revoked.length,
    0,
  );
  const linkedVehicles = entries.filter((entry) => entry.active.length > 0).length;
  const someFailed = entries.some((entry) => entry.failed);

  return (
    <section className="g-gest g-gest--talleres">
      <header className="g-gest-head">
        <p className="g-gest-eyebrow">
          <ShieldIcon size={13} />
          Gestión de acceso
        </p>
        <h2>Talleres autorizados</h2>
        <p>
          Controla qué talleres mecánicos tienen permiso para consultar la
          bitácora o asentar nuevos mantenimientos.
        </p>
      </header>

      <aside className="g-gest-banner">
        <span className="g-gest-banner-icon" aria-hidden="true">
          <LockIcon size={18} />
        </span>
        <span>
          <strong>Privacidad del cuaderno digital</strong>
          <span>
            Los talleres solo acceden con el permiso que tú les das, y puedes
            revocarlo en cualquier momento.
          </span>
        </span>
      </aside>

      {someFailed && (
        <div className="g-alert g-alert--error" role="alert">
          No pudimos cargar las autorizaciones de algunos vehículos.
        </div>
      )}

      <Stats
        items={[
          { value: activeCount, label: 'Activas', tone: 'green' },
          { value: revokedCount, label: 'Revocadas', tone: 'alert' },
          { value: linkedVehicles, label: 'Autos unidos', tone: 'lilac' },
        ]}
      />

      <nav className="g-gest-tabs" aria-label="Filtrar autorizaciones">
        <span className="g-gest-segment">
          {FILTROS.map((item) => (
            <Link
              key={item.value}
              href={`/talleres?filtro=${item.value}`}
              className={
                filtro === item.value
                  ? 'g-gest-segment-item is-active'
                  : 'g-gest-segment-item'
              }
              aria-current={filtro === item.value ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </span>
        <Link
          href="/talleres?filtro=todas"
          className={
            filtro === 'todas' ? 'g-gest-tabs-all is-active' : 'g-gest-tabs-all'
          }
          aria-current={filtro === 'todas' ? 'page' : undefined}
        >
          <DocumentIcon size={13} />
          Ver todas
        </Link>
      </nav>

      {entries.length === 0 ? (
        <article className="g-card g-gest-state">
          <span className="g-gest-state-icon" aria-hidden="true">
            <CarIcon size={26} />
          </span>
          <h3>Aún no tienes vehículos</h3>
          <p>
            Agrega un vehículo a tu garaje para poder autorizar talleres.
          </p>
          <div className="g-gest-state-actions">
            <Link href="/garaje/nuevo" className="g-btn g-btn--primary">
              <PlusIcon size={18} />
              Agregar vehículo
            </Link>
          </div>
        </article>
      ) : (
        entries.map((entry) => {
          const visibles =
            filtro === 'activas'
              ? entry.active
              : filtro === 'revocadas'
                ? entry.revoked
                : [...entry.active, ...entry.revoked];

          return (
            <section key={entry.vehicle.id} className="g-gest-section">
              <div className="g-gest-section-head">
                <h3>
                  {entry.vehicle.brand} {entry.vehicle.model}
                </h3>
                <span>{entry.vehicle.plate}</span>
              </div>

              {visibles.length > 0 ? (
                <div className="g-aut-list">
                  {visibles.map((authorization) => (
                    <AuthorizationCard
                      key={authorization.id}
                      authorization={authorization}
                    />
                  ))}
                </div>
              ) : (
                <div className="g-card g-gest-empty">
                  <span className="g-gest-state-icon" aria-hidden="true">
                    <ShieldIcon size={24} />
                  </span>
                  <p>
                    {filtro === 'revocadas'
                      ? 'Este vehículo no tiene autorizaciones revocadas.'
                      : 'Ningún taller tiene acceso activo a este vehículo.'}
                  </p>
                </div>
              )}

              <div className="g-gest-actions">
                <Link
                  href={`/garaje/${entry.vehicle.id}/autorizaciones/nueva`}
                  className="g-btn g-btn--soft"
                >
                  Otorgar acceso
                </Link>
                <Link
                  href={`/garaje/${entry.vehicle.id}/autorizaciones`}
                  className="g-gest-link"
                >
                  Ver todas, incluidas las revocadas
                </Link>
              </div>
            </section>
          );
        })
      )}
    </section>
  );
}

function WorkshopsSkeleton() {
  return (
    <section className="g-gest" aria-busy="true">
      <div className="g-skeleton g-gest-skeleton-head" />
      <div className="g-skeleton g-gest-skeleton-text" />
      <div className="g-skeleton g-gest-skeleton-card" />
      <div className="g-skeleton g-gest-skeleton-tall" />
    </section>
  );
}
