import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { VehicleMissing } from '@/components/gestion/vehicle-missing';
import {
  ArrowRightIcon,
  CarIcon,
  CheckIcon,
  DocumentIcon,
  LockIcon,
  ShieldIcon,
  WorkshopIcon,
} from '@/components/ui/icons';
import {
  fechaAutorizacion,
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
  // Código corto y legible a partir del ID de la autorización.
  const codigo = `AUTH-${authorization.id.slice(0, 4).toUpperCase()}`;
  const fechaAlta = fechaAutorizacion(authorization.createdAt);

  return (
    <section className="g-gest">
      <section className="g-gest-hero">
        <span className="g-gest-hero-check" aria-hidden="true">
          <CheckIcon size={36} />
        </span>
        <span className="g-gest-hero-tag">Sincronización segura activa</span>
        <h2>¡Autorización concedida con éxito!</h2>
        <p>
          El taller ya puede trabajar con la bitácora de{' '}
          <strong>{vehicle.data.plate}</strong> bajo las condiciones que
          definiste.
        </p>
      </section>

      <section className="g-card g-gest-voucher">
        <div className="g-gest-voucher-head">
          <span className="g-gest-voucher-title">
            <span className="g-gest-voucher-icon" aria-hidden="true">
              <DocumentIcon size={15} />
            </span>
            Voucher de permiso
          </span>
          <span className={`g-pill ${status.className}`}>{status.label}</span>
        </div>

        <div className="g-gest-voucher-item">
          <span className="g-gest-voucher-badge" aria-hidden="true">
            <WorkshopIcon size={20} />
          </span>
          <span>
            <small>Taller autorizado</small>
            <strong>{workshopLabel(authorization)}</strong>
          </span>
        </div>

        <div className="g-gest-voucher-item">
          <span className="g-gest-voucher-badge" aria-hidden="true">
            <CarIcon size={20} />
          </span>
          <span>
            <small>Vehículo asociado</small>
            <strong>
              {vehicle.data.brand} {vehicle.data.model} {vehicle.data.year}
              <span className="g-gest-voucher-plate">
                {vehicle.data.plate}
              </span>
            </strong>
          </span>
        </div>

        <div className="g-gest-voucher-scope">
          <small>Alcance concedido</small>
          <p>
            <span className={`g-pill ${permission.className}`}>
              {permission.label}
            </span>
            {permission.description}.
          </p>
        </div>

        <div className="g-gest-voucher-code">
          {fechaAlta && (
            <span>
              <small>Fecha de alta</small>
              <strong>{fechaAlta}</strong>
            </span>
          )}
          <span>
            <small>Código</small>
            <strong>{codigo}</strong>
          </span>
        </div>
      </section>

      <article className="g-gest-control">
        <span className="g-gest-control-icon" aria-hidden="true">
          <LockIcon size={16} />
        </span>
        <span>
          <strong>Control total de tus datos</strong>
          <p>
            Puedes cambiar el permiso o revocar el acceso cuando quieras desde
            Talleres. Los servicios que el taller ya registró se conservan
            intactos.
          </p>
        </span>
      </article>

      <div className="g-gest-actions">
        <Link href={base} className="g-btn g-btn--primary">
          Ver autorizaciones activas
          <ArrowRightIcon size={18} />
        </Link>
        <Link href="/talleres/otorgar" className="g-btn g-btn--outline">
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
