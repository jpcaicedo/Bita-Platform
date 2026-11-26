import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthorizationCard } from '@/components/autorizaciones/authorization-card';
import { VehicleMissing } from '@/components/gestion/vehicle-missing';
import { VehicleStrip } from '@/components/gestion/vehicle-strip';
import {
  ArrowRightIcon,
  ShieldIcon,
  WorkshopIcon,
} from '@/components/ui/icons';
import {
  getVehicleAuthorizations,
  splitAuthorizations,
} from '@/lib/authorizations';
import { getMyVehicle } from '@/lib/garaje';
import { requireOwner } from '@/lib/session';
import '@/components/gestion/gestion.css';

export const metadata: Metadata = {
  title: 'Talleres autorizados',
};

interface AuthorizationListParams {
  estado?: string;
  ok?: string;
}

const AVISOS: Record<string, string> = {
  revocada: 'Autorización revocada. El taller ya no tiene acceso al vehículo.',
};

export default function AutorizacionesPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<AuthorizationListParams>;
}) {
  return (
    <Suspense fallback={<AuthorizationsSkeleton />}>
      <AuthorizationsContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function AuthorizationsContent({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<AuthorizationListParams>;
}) {
  const [{ vehicleId }, query] = await Promise.all([params, searchParams]);
  await requireOwner();

  const [vehicle, authorizations] = await Promise.all([
    getMyVehicle(vehicleId),
    getVehicleAuthorizations(vehicleId),
  ]);

  if (!vehicle.ok || !vehicle.data) {
    return <VehicleMissing status={vehicle.status} />;
  }

  const { active, revoked } = splitAuthorizations(
    authorizations.ok ? (authorizations.data ?? []) : [],
  );
  const showRevoked = query.estado === 'revocadas';
  const visible = showRevoked ? revoked : active;
  const notice = query.ok ? AVISOS[query.ok] : undefined;
  const base = `/garaje/${vehicleId}/autorizaciones`;

  return (
    <section className="g-gest">
      <header className="g-gest-head">
        <p>
          Controla qué talleres pueden consultar o asentar mantenimientos en
          este vehículo.
        </p>
      </header>

      <VehicleStrip vehicle={vehicle.data} />

      {notice && (
        <div className="g-alert g-alert--ok" role="status">
          {notice}
        </div>
      )}

      {!authorizations.ok && (
        <div className="g-alert g-alert--error" role="alert">
          No pudimos cargar las autorizaciones de este vehículo.
        </div>
      )}

      <nav className="g-aut-tabs" aria-label="Filtrar autorizaciones">
        <Link
          href={base}
          className="g-aut-tab"
          aria-current={!showRevoked ? 'page' : undefined}
        >
          Activas ({active.length})
        </Link>
        <Link
          href={`${base}?estado=revocadas`}
          className="g-aut-tab"
          aria-current={showRevoked ? 'page' : undefined}
        >
          Revocadas ({revoked.length})
        </Link>
      </nav>

      {visible.length > 0 ? (
        <div className="g-aut-list">
          {visible.map((authorization) => (
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
            {showRevoked
              ? 'No has revocado ninguna autorización de este vehículo.'
              : 'Ningún taller tiene acceso activo a este vehículo. Otorga acceso a un taller de confianza para que registre sus servicios.'}
          </p>
        </div>
      )}

      <div className="g-gest-actions">
        <Link
          href={`/talleres/otorgar?vehiculo=${vehicleId}`}
          className="g-btn g-btn--primary"
        >
          <WorkshopIcon size={18} />
          Otorgar nueva autorización
          <ArrowRightIcon size={18} />
        </Link>
      </div>
    </section>
  );
}

function AuthorizationsSkeleton() {
  return (
    <section className="g-gest" aria-busy="true">
      <div className="g-skeleton g-gest-skeleton-head" />
      <div className="g-skeleton g-gest-skeleton-text" />
      <div className="g-skeleton g-gest-skeleton-card" />
      <div className="g-skeleton g-gest-skeleton-tall" />
    </section>
  );
}
