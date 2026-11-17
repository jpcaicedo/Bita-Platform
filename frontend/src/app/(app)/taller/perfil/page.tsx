import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { ShieldIcon, WorkshopIcon } from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { requireWorkshop } from '@/lib/session';
import { saveWorkshopProfileAction } from '@/lib/taller-actions';

export const metadata: Metadata = {
  title: 'Perfil del taller',
};

interface ProfileParams {
  ok?: string;
  error?: string;
  completar?: string;
}

const ERRORES: Record<string, string> = {
  nombre: 'El nombre del taller es obligatorio y debe tener máximo 120 caracteres.',
  empresa: 'La razón social debe tener máximo 150 caracteres.',
  nit: 'La identificación debe tener máximo 40 caracteres.',
  datos: 'El servidor rechazó los datos. Revísalos e inténtalo de nuevo.',
  conexion: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
};

export default function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<ProfileParams>;
}) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProfileContent({
  searchParams,
}: {
  searchParams: Promise<ProfileParams>;
}) {
  const params = await searchParams;
  const session = await requireWorkshop();
  const workshop = session.workshop;
  const errorText = params.error
    ? ERRORES[params.error] ?? ERRORES.datos
    : null;

  return (
    <>
      <header className="g-taller-head">
        <h2>Perfil del taller</h2>
        <p>
          Estos datos aparecen en el comprobante de cada servicio que registres.
        </p>
      </header>

      <section className="g-card g-profile-card">
        <span className="g-profile-badge" aria-hidden="true">
          <WorkshopIcon size={28} />
        </span>
        <div>
          <h2>{workshop?.name ?? 'Completa tu taller'}</h2>
          <p>
            {workshop
              ? 'Tu perfil está activo. Puedes actualizar los datos cuando quieras.'
              : 'Crea el perfil para empezar a registrar servicios.'}
          </p>
        </div>
      </section>

      {params.completar === '1' && !workshop && (
        <div className="g-alert g-alert--info" role="status">
          Tu cuenta está creada. Solo falta el perfil comercial del taller.
        </div>
      )}

      {params.ok === '1' && (
        <div className="g-alert g-alert--ok" role="status">
          Perfil guardado correctamente.
        </div>
      )}

      {errorText && (
        <div className="g-alert g-alert--error" role="alert">
          {errorText}
        </div>
      )}

      <form action={saveWorkshopProfileAction} className="g-card g-form-card">
        <h3>{workshop ? 'Datos comerciales' : 'Crear perfil'}</h3>

        <div className="g-field">
          <label htmlFor="workshop-name" className="g-label">
            Nombre del taller *
          </label>
          <input
            id="workshop-name"
            className="g-input"
            type="text"
            name="name"
            defaultValue={workshop?.name ?? session.user.username ?? ''}
            maxLength={120}
            placeholder="Ej. Taller Los Andes"
            required
          />
        </div>

        <div className="g-field">
          <label htmlFor="workshop-business" className="g-label">
            Razón social
          </label>
          <input
            id="workshop-business"
            className="g-input"
            type="text"
            name="businessName"
            defaultValue={workshop?.businessName ?? ''}
            maxLength={150}
            placeholder="Ej. Taller Los Andes S.A.S."
          />
        </div>

        <div className="g-field">
          <label htmlFor="workshop-id" className="g-label">
            Identificación o NIT
          </label>
          <input
            id="workshop-id"
            className="g-input"
            type="text"
            name="identification"
            defaultValue={workshop?.identification ?? ''}
            maxLength={40}
            placeholder="Ej. 900123456-7"
          />
        </div>

        <SubmitButton pendingText="Guardando…">
          {workshop ? 'Guardar cambios' : 'Crear perfil'}
        </SubmitButton>
      </form>

      <section className="g-card g-form-card">
        <h3>Cómo funciona el acceso</h3>
        <p className="g-subtitle">
          Los dueños autorizan a tu taller desde su garaje. Solo verás los
          vehículos con una autorización activa y podrás registrar servicios
          cuando tengas permiso de escritura.
        </p>
        <Link href="/taller" className="g-btn g-btn--soft">
          <ShieldIcon size={18} />
          Ir a recepción
        </Link>
      </section>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <>
      <div className="g-skeleton g-taller-skeleton-head" />
      <div className="g-skeleton g-taller-skeleton-text" />
      <div className="g-skeleton g-taller-skeleton-card" />
      <div className="g-skeleton g-taller-skeleton-tall" />
    </>
  );
}
