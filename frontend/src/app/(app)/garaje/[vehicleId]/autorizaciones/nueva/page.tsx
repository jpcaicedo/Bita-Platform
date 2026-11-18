import type { Metadata } from 'next';
import { Suspense } from 'react';
import { VehicleMissing } from '@/components/gestion/vehicle-missing';
import { VehicleStrip } from '@/components/gestion/vehicle-strip';
import {
  ArrowRightIcon,
  ShieldIcon,
  WorkshopIcon,
} from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { grantAuthorizationAction } from '@/lib/authorizations-actions';
import { getMyVehicle } from '@/lib/garaje';
import { requireOwner } from '@/lib/session';
import { isUuid } from '@/lib/uuid';
import '@/components/gestion/gestion.css';

export const metadata: Metadata = {
  title: 'Otorgar acceso',
};

interface GrantParams {
  error?: string;
  taller?: string;
}

const ERRORES: Record<string, string> = {
  taller_id: 'Escribe un ID de taller válido (formato UUID).',
  permisos: 'Elige un nivel de permiso para el taller.',
  propio: 'No puedes autorizarte a ti mismo como taller.',
  taller_no_existe:
    'No encontramos un taller con ese ID. Pídele al taller que lo copie desde su perfil.',
  vehiculo: 'No encontramos el vehículo.',
  acceso: 'Solo el dueño del vehículo puede otorgar accesos.',
  conexion: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
  datos:
    'El servidor rechazó la autorización. Revisa los datos e inténtalo de nuevo.',
};

export default function NuevaAutorizacionPage({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<GrantParams>;
}) {
  return (
    <Suspense fallback={<GrantSkeleton />}>
      <GrantContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function GrantContent({
  params,
  searchParams,
}: {
  params: Promise<{ vehicleId: string }>;
  searchParams: Promise<GrantParams>;
}) {
  const [{ vehicleId }, query] = await Promise.all([params, searchParams]);
  await requireOwner();

  const vehicle = await getMyVehicle(vehicleId);

  if (!vehicle.ok || !vehicle.data) {
    return <VehicleMissing status={vehicle.status} />;
  }

  const errorText = query.error
    ? (ERRORES[query.error] ?? ERRORES.datos)
    : null;
  const workshopId = query.taller && isUuid(query.taller) ? query.taller : '';

  return (
    <section className="g-gest">
      <header className="g-gest-head">
        <p className="g-gest-eyebrow">
          <span className="g-gest-step">Paso 1 de 2</span>
          Configurar acceso
        </p>
        <h2>Otorgar acceso a taller</h2>
        <p>
          Selecciona el taller mecánico y define qué permisos tendrá sobre tu
          vehículo en la bitácora.
        </p>
      </header>

      <VehicleStrip vehicle={vehicle.data} />

      {errorText && (
        <div className="g-alert g-alert--error" role="alert">
          {errorText}
        </div>
      )}

      <form action={grantAuthorizationAction} className="g-card g-gest-form">
        <input type="hidden" name="vehicleId" value={vehicleId} />

        <h3 className="g-gest-form-title">
          <WorkshopIcon size={18} />
          Taller mecánico
        </h3>

        <div className="g-field">
          <label htmlFor="grant-workshop" className="g-label">
            ID del taller *
          </label>
          <input
            id="grant-workshop"
            className="g-input"
            type="text"
            name="workshopId"
            defaultValue={workshopId}
            maxLength={36}
            placeholder="00000000-0000-0000-0000-000000000000"
            autoComplete="off"
            spellCheck={false}
            required
          />
          <p className="g-help">
            Pídele al taller el ID de su cuenta. Lo encuentra en su perfil.
          </p>
        </div>

        <fieldset className="g-aut-perms">
          <legend className="g-label">Nivel de permiso</legend>

          <label className="g-aut-perm">
            <input type="radio" name="permission" value="read" defaultChecked />
            <span className="g-aut-perm-body">
              <span className="g-aut-perm-head">
                <strong>Solo lectura</strong>
                <span className="g-aut-perm-mark" aria-hidden="true" />
              </span>
              <span className="g-pill g-pill--blue">
                Recomendado para cotizaciones
              </span>
              <p>
                El taller puede consultar la ficha técnica, el kilometraje y los
                mantenimientos anteriores. No puede asentar nuevas
                intervenciones.
              </p>
            </span>
          </label>

          <label className="g-aut-perm">
            <input type="radio" name="permission" value="write" />
            <span className="g-aut-perm-body">
              <span className="g-aut-perm-head">
                <strong>Lectura + escritura</strong>
                <span className="g-aut-perm-mark" aria-hidden="true" />
              </span>
              <span className="g-pill g-pill--lilac">
                Para taller de confianza
              </span>
              <p>
                Puede consultar la bitácora y asentar directamente nuevos
                servicios, repuestos, costos y garantías.
              </p>
            </span>
          </label>
        </fieldset>

        <SubmitButton pendingText="Otorgando…">
          Otorgar autorización
          <ArrowRightIcon size={18} />
        </SubmitButton>
      </form>

      <p className="g-help g-gest-note">
        <ShieldIcon size={14} />
        Puedes revocar o cambiar este permiso en cualquier momento desde
        Talleres.
      </p>
    </section>
  );
}

function GrantSkeleton() {
  return (
    <section className="g-gest" aria-busy="true">
      <div className="g-skeleton g-gest-skeleton-head" />
      <div className="g-skeleton g-gest-skeleton-text" />
      <div className="g-skeleton g-gest-skeleton-card" />
      <div className="g-skeleton g-gest-skeleton-tall" />
    </section>
  );
}
