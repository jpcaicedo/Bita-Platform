import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import {
  ArrowRightIcon,
  CarIcon,
  PlusIcon,
  ShieldIcon,
  WorkshopIcon,
} from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { grantAuthorizationAction } from '@/lib/authorizations-actions';
import { getMyVehicles } from '@/lib/garaje';
import { requireOwner } from '@/lib/session';
import { isUuid } from '@/lib/uuid';
import '@/components/gestion/gestion.css';

export const metadata: Metadata = {
  title: 'Otorgar acceso',
};

interface GrantParams {
  error?: string;
  taller?: string;
  // IDs de vehículos que llegan marcados, separados por coma.
  vehiculo?: string;
}

const ERRORES: Record<string, string> = {
  taller_id: 'Escribe un ID de taller válido (formato UUID).',
  permisos: 'Elige un nivel de permiso para el taller.',
  propio: 'No puedes autorizarte a ti mismo como taller.',
  taller_no_existe:
    'No encontramos un taller con ese ID. Pídele al taller que lo copie desde su perfil.',
  vehiculos: 'Elige al menos un vehículo.',
  vehiculo: 'No encontramos uno de los vehículos.',
  acceso: 'Solo el dueño del vehículo puede otorgar accesos.',
  conexion: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
  datos:
    'El servidor rechazó la autorización. Revisa los datos e inténtalo de nuevo.',
};

// Un solo formulario para autorizar un taller en uno o varios vehículos
// (Figma "Dueño - Otorgar Autorización a Taller").
export default function OtorgarAutorizacionPage({
  searchParams,
}: {
  searchParams: Promise<GrantParams>;
}) {
  return (
    <Suspense fallback={<GrantSkeleton />}>
      <GrantContent searchParams={searchParams} />
    </Suspense>
  );
}

async function GrantContent({
  searchParams,
}: {
  searchParams: Promise<GrantParams>;
}) {
  const query = await searchParams;
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

  if (vehicles.data.length === 0) {
    return (
      <section className="g-gest">
        <article className="g-card g-gest-state">
          <span className="g-gest-state-icon" aria-hidden="true">
            <CarIcon size={26} />
          </span>
          <h3>Aún no tienes vehículos</h3>
          <p>Agrega un vehículo a tu garaje para poder autorizar talleres.</p>
          <div className="g-gest-state-actions">
            <Link href="/garaje/nuevo" className="g-btn g-btn--primary">
              <PlusIcon size={18} />
              Agregar vehículo
            </Link>
          </div>
        </article>
      </section>
    );
  }

  const marcados = new Set(
    (query.vehiculo ?? '').split(',').filter((id) => isUuid(id)),
  );
  // Con un solo vehículo no hay nada que elegir: va marcado.
  if (vehicles.data.length === 1) marcados.add(vehicles.data[0].id);

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
          Selecciona el taller mecánico y define qué permisos tendrá sobre tus
          vehículos en la bitácora.
        </p>
      </header>

      {errorText && (
        <div className="g-alert g-alert--error" role="alert">
          {errorText}
        </div>
      )}

      <form action={grantAuthorizationAction} className="g-card g-gest-form">
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

        <fieldset className="g-aut-vehicles">
          <legend className="g-aut-vehicles-head">
            <span className="g-label">Vehículo(s) autorizados</span>
            <small>Elige uno o varios</small>
          </legend>

          <div className="g-aut-chips">
            {vehicles.data.map((vehicle) => (
              <label key={vehicle.id} className="g-aut-chip">
                <input
                  type="checkbox"
                  name="vehicleIds"
                  value={vehicle.id}
                  defaultChecked={marcados.has(vehicle.id)}
                />
                <span>
                  <strong>
                    {vehicle.brand} {vehicle.model}
                  </strong>
                  <small>{vehicle.plate}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

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
