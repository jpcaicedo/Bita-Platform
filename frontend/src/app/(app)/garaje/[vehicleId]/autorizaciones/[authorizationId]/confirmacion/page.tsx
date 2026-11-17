import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { VehicleMissing } from '@/components/gestion/vehicle-missing';
import {
  ArrowRightIcon,
  CheckIcon,
  ShieldIcon,
} from '@/components/ui/icons';
import {
  findAuthorization,
  permissionOf,
  statusOf,
  workshopLabel,
} from '@/lib/authorizations';
import { getMyVehicle } from '@/lib/garaje';
import { requireOwner } from '@/lib/session';
import '@/components/gestion/gestion.css';

export const metadata: Metadata = {
  title: 'Autorización concedida',
};

export default function ConfirmacionAutorizacionPage({
  params,
}: {
  params: Promise<{ vehicleId: string; authorizationId: string }>;
}) {
  return (
    <Suspense fallback={<ConfirmationSkeleton />}>
      <ConfirmationContent params={params} />
    </Suspense>
  );
}

async function ConfirmationContent({
  params,
}: {
  params: Promise<{ vehicleId: string; authorizationId: string }>;
}) {
  const { vehicleId, authorizationId } = await params;
  await requireOwner();

  const [vehicle, authorization] = await Promise.all([
    getMyVehicle(vehicleId),
    findAuthorization(vehicleId, authorizationId),
  ]);

  if (!vehicle.ok || !vehicle.data) {
    return <VehicleMissing status={vehicle.status} />;
  }

  if (!authorization) {
    return (
      <section className="g-gest">
        <article className="g-card g-gest-state">
          <span className="g-gest-state-icon" aria-hidden="true">
            <ShieldIcon size={26} />
          </span>
          <h3>No encontramos la autorización</h3>
          <p>
            Pudo guardarse, pero no logramos leer su detalle. Revisa la lista
            de talleres autorizados para confirmarlo.
          </p>
          <div className="g-gest-state-actions">
            <Link
              href={`/garaje/${vehicleId}/autorizaciones`}
              className="g-btn g-btn--primary"
            >
              Ver autorizaciones
            </Link>
          </div>
        </article>
      </section>
    );
  }

  const permission = permissionOf(authorization);
  const status = statusOf(authorization);
  const base = `/garaje/${vehicleId}/autorizaciones`;

  return (
    <section className="g-gest">
      <section className="g-gest-hero">
        <span className="g-gest-hero-check" aria-hidden="true">
          <CheckIcon size={36} />
        </span>
        <h2>Autorización concedida</h2>
        <p>
          El taller ya puede trabajar sobre{' '}
          <strong>{vehicle.data.plate}</strong> con los permisos que definiste.
        </p>
      </section>

      <section className="g-card g-gest-receipt">
        <div className="g-gest-receipt-head">
          <strong>Resumen del permiso</strong>
          <span className={`g-pill ${status.className}`}>{status.label}</span>
        </div>

        <dl className="g-gest-rows">
          <div className="g-gest-row">
            <dt>Taller</dt>
            <dd>{workshopLabel(authorization.workshopId)}</dd>
          </div>
          <div className="g-gest-row">
            <dt>Vehículo</dt>
            <dd>
              {vehicle.data.brand} {vehicle.data.model} · {vehicle.data.plate}
            </dd>
          </div>
          <div className="g-gest-row">
            <dt>Permiso</dt>
            <dd>{permission.label}</dd>
          </div>
          <div className="g-gest-row">
            <dt>Consultar historial</dt>
            <dd>{authorization.canRead ? 'Sí' : 'No'}</dd>
          </div>
          <div className="g-gest-row">
            <dt>Registrar servicios</dt>
            <dd>{authorization.canWrite ? 'Sí' : 'No'}</dd>
          </div>
        </dl>
      </section>

      <article className="g-card g-gest-callout">
        <strong>Tienes el control total de tus datos</strong>
        <p>
          Puedes cambiar el permiso o revocar el acceso cuando quieras. Los
          servicios que el taller ya registró se conservan intactos.
        </p>
      </article>

      <div className="g-gest-actions">
        <Link href={base} className="g-btn g-btn--primary">
          Ver autorizaciones activas
          <ArrowRightIcon size={18} />
        </Link>
        <Link href={`${base}/nueva`} className="g-btn g-btn--outline">
          Otorgar otra autorización
        </Link>
      </div>
    </section>
  );
}

function ConfirmationSkeleton() {
  return (
    <section className="g-gest" aria-busy="true">
      <div className="g-skeleton g-gest-skeleton-head" />
      <div className="g-skeleton g-gest-skeleton-text" />
      <div className="g-skeleton g-gest-skeleton-tall" />
    </section>
  );
}
