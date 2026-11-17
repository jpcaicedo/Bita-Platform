import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthorizationCard } from '@/components/autorizaciones/authorization-card';
import { Stats } from '@/components/gestion/stats';
import { CarIcon, PlusIcon, ShieldIcon } from '@/components/ui/icons';
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

export default function TalleresPage() {
  return (
    <Suspense fallback={<WorkshopsSkeleton />}>
      <WorkshopsContent />
    </Suspense>
  );
}

async function WorkshopsContent() {
  await requireOwner();

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
    <section className="g-gest">
      <header className="g-gest-head">
        <h2>Talleres autorizados</h2>
        <p>
          Controla qué talleres mecánicos tienen permiso para consultar o
          asentar mantenimientos en tus vehículos.
        </p>
      </header>

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
        entries.map((entry) => (
          <section key={entry.vehicle.id} className="g-gest-section">
            <div className="g-gest-section-head">
              <h3>
                {entry.vehicle.brand} {entry.vehicle.model}
              </h3>
              <span>{entry.vehicle.plate}</span>
            </div>

            {entry.active.length > 0 ? (
              <div className="g-aut-list">
                {entry.active.map((authorization) => (
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
                <p>Ningún taller tiene acceso activo a este vehículo.</p>
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
        ))
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
