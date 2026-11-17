import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { VehicleMissing } from '@/components/gestion/vehicle-missing';
import { ShieldIcon } from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  findAuthorization,
  permissionOf,
  workshopLabel,
} from '@/lib/authorizations';
import { revokeAuthorizationAction } from '@/lib/authorizations-actions';
import { getMyVehicle } from '@/lib/garaje';
import { requireOwner } from '@/lib/session';
import '@/components/gestion/gestion.css';

export const metadata: Metadata = {
  title: 'Revocar acceso',
};

interface RevokeParams {
  error?: string;
}

const ERRORES: Record<string, string> = {
  motivo: 'El motivo debe tener máximo 500 caracteres.',
  ya_revocada: 'Esta autorización ya estaba revocada.',
  no_encontrada: 'No encontramos la autorización.',
  acceso: 'Solo el dueño del vehículo puede revocar accesos.',
  conexion: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
  datos: 'El servidor rechazó la solicitud. Inténtalo de nuevo.',
};

export default function RevocarAutorizacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string; authorizationId: string }>;
  searchParams: Promise<RevokeParams>;
}) {
  return (
    <Suspense fallback={<RevokeSkeleton />}>
      <RevokeContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RevokeContent({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string; authorizationId: string }>;
  searchParams: Promise<RevokeParams>;
}) {
  const [{ vehicleId, authorizationId }, query] = await Promise.all([
    params,
    searchParams,
  ]);
  await requireOwner();

  const [vehicle, authorization] = await Promise.all([
    getMyVehicle(vehicleId),
    findAuthorization(vehicleId, authorizationId),
  ]);

  if (!vehicle.ok || !vehicle.data) {
    return <VehicleMissing status={vehicle.status} />;
  }

  const base = `/garaje/${vehicleId}/autorizaciones`;

  if (!authorization || authorization.status !== 'active') {
    return (
      <section className="g-gest">
        <article className="g-card g-gest-state">
          <span className="g-gest-state-icon" aria-hidden="true">
            <ShieldIcon size={26} />
          </span>
          <h3>No hay acceso por revocar</h3>
          <p>
            La autorización no existe o ya fue revocada. Revisa la lista para
            confirmarlo.
          </p>
          <div className="g-gest-state-actions">
            <Link href={base} className="g-btn g-btn--primary">
              Ver autorizaciones
            </Link>
          </div>
        </article>
      </section>
    );
  }

  const permission = permissionOf(authorization);
  const errorText = query.error
    ? (ERRORES[query.error] ?? ERRORES.datos)
    : null;

  return (
    <section className="g-gest">
      <article className="g-card g-gest-state g-gest-state--alert">
        <span className="g-gest-state-icon" aria-hidden="true">
          <ShieldIcon size={26} />
        </span>
        <h3>¿Quieres revocar esta autorización?</h3>
        <p>
          El taller dejará de tener acceso a la información y a las
          funcionalidades autorizadas de manera inmediata.
        </p>
      </article>

      <section className="g-card g-gest-receipt">
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
            <dt>Permiso a anular</dt>
            <dd>{permission.label}</dd>
          </div>
        </dl>
      </section>

      <article className="g-card g-gest-callout">
        <strong>Garantía de inmutabilidad</strong>
        <p>
          Los servicios registrados previamente por este taller permanecerán
          intactos e inalterables en tu historial.
        </p>
      </article>

      {errorText && (
        <div className="g-alert g-alert--error" role="alert">
          {errorText}
        </div>
      )}

      <form action={revokeAuthorizationAction} className="g-card g-gest-form">
        <input type="hidden" name="vehicleId" value={vehicleId} />
        <input type="hidden" name="authorizationId" value={authorizationId} />

        <div className="g-field">
          <label htmlFor="revoke-reason" className="g-label">
            Motivo
          </label>
          <textarea
            id="revoke-reason"
            className="g-textarea"
            name="reason"
            maxLength={500}
            placeholder="Opcional. Queda registrado en el historial de accesos."
          />
        </div>

        <SubmitButton
          className="g-btn g-btn--danger"
          pendingText="Revocando…"
        >
          Revocar autorización
        </SubmitButton>

        <Link href={base} className="g-btn g-btn--outline">
          Cancelar y mantener acceso
        </Link>
      </form>
    </section>
  );
}

function RevokeSkeleton() {
  return (
    <section className="g-gest" aria-busy="true">
      <div className="g-skeleton g-gest-skeleton-tall" />
      <div className="g-skeleton g-gest-skeleton-card" />
      <div className="g-skeleton g-gest-skeleton-card" />
    </section>
  );
}
