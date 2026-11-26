import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  ChevronRightIcon,
  LockIcon,
  LogOutIcon,
  UserIcon,
  WorkshopIcon,
} from '@/components/ui/icons';
import { logoutAction } from '@/lib/auth-actions';
import {
  changePasswordAction,
  updateProfileAction,
} from '@/lib/profile-actions';
import { requireSession } from '@/lib/session';
import './ajustes.css';

export const metadata: Metadata = {
  title: 'Ajustes',
};

interface AjustesParams {
  ok?: string;
  error?: string;
  username?: string;
  email?: string;
  phone?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  usuario: 'El nombre de usuario debe tener máximo 60 caracteres.',
  email: 'Escribe un correo electrónico válido.',
  telefono:
    'El teléfono solo puede tener números, espacios, +, - y paréntesis (máximo 30 caracteres).',
  existe: 'Ya existe otra cuenta con ese correo electrónico.',
  datos: 'El servidor rechazó los datos. Revísalos e inténtalo de nuevo.',
  conexion: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
  pass_campos: 'Completa las tres contraseñas para actualizarla.',
  pass_regla:
    'La nueva contraseña debe tener entre 8 y 15 caracteres y solo puede usar letras, números, espacios o guiones.',
  pass_confirm: 'La nueva contraseña y su confirmación no coinciden.',
  pass_igual: 'La nueva contraseña debe ser diferente a la actual.',
  pass_actual: 'La contraseña actual no es correcta.',
  pass_conexion: 'No pudimos conectar con el servidor. Inténtalo otra vez.',
  pass_datos: 'No se pudo cambiar la contraseña. Inténtalo de nuevo.',
};

const OK_MESSAGES: Record<string, string> = {
  perfil: 'Tus datos se guardaron correctamente.',
  password: 'Tu contraseña se actualizó correctamente.',
};

function initialsFor(name: string, email: string): string {
  const source = name.trim() || email.split('@')[0] || 'B';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

export default function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<AjustesParams>;
}) {
  return (
    <Suspense fallback={<div className="g-skeleton g-settings-skeleton" />}>
      <AjustesContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AjustesContent({
  searchParams,
}: {
  searchParams: Promise<AjustesParams>;
}) {
  const params = await searchParams;
  const session = await requireSession();
  const role = session.isWorkshop ? 'Taller' : 'Dueño';
  const displayName = session.user.username || 'Usuario BITA';
  const initials = initialsFor(displayName, session.user.email);
  const errorKey = params.error ?? '';
  const isPasswordError = errorKey.startsWith('pass_');
  const profileErrorText =
    errorKey && !isPasswordError
      ? (ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.datos)
      : null;
  const passwordErrorText = isPasswordError
    ? (ERROR_MESSAGES[errorKey] ?? ERROR_MESSAGES.pass_datos)
    : null;
  const okText = params.ok ? (OK_MESSAGES[params.ok] ?? null) : null;

  // Si el servidor rechazó el formulario, conservamos lo que se escribió.
  const username = params.username ?? session.user.username ?? '';
  const email = params.email ?? session.user.email;
  const phone = params.phone ?? session.user.phone ?? '';

  return (
    <section className="g-settings">
      <article className="g-card g-settings-card">
        <span className="g-settings-avatar" aria-hidden="true">
          {initials}
        </span>

        <div className="g-settings-identity">
          <h2 className="g-settings-name">{displayName}</h2>
          <p className="g-settings-email">{session.user.email}</p>
          <div className="g-settings-meta">
            <span className="g-pill g-pill--blue">Rol: {role}</span>
            {session.workshop && (
              <span className="g-settings-workshop">
                {session.workshop.name}
              </span>
            )}
          </div>
        </div>
      </article>

      {okText && (
        <div className="g-alert g-alert--ok" role="status">
          {okText}
        </div>
      )}

      {profileErrorText && (
        <div className="g-alert g-alert--error" role="alert">
          {profileErrorText}
        </div>
      )}

      <form action={updateProfileAction} className="g-card g-settings-form">
        <header className="g-settings-head">
          <span className="g-settings-head-icon" aria-hidden="true">
            <UserIcon size={18} />
          </span>
          <div className="g-settings-head-text">
            <h3>Datos personales</h3>
            <p>Tu nombre visible, correo y teléfono de contacto.</p>
          </div>
        </header>

        <div className="g-settings-fields">
          <div className="g-field">
            <label htmlFor="profile-username" className="g-label">
              Nombre de usuario
            </label>
            <input
              id="profile-username"
              className="g-input"
              type="text"
              name="username"
              defaultValue={username}
              maxLength={60}
              autoComplete="username"
              placeholder="Ej. Martín Pérez"
            />
          </div>

          <div className="g-field">
            <label htmlFor="profile-email" className="g-label">
              Correo electrónico *
            </label>
            <input
              id="profile-email"
              className="g-input"
              type="email"
              name="email"
              defaultValue={email}
              maxLength={254}
              autoComplete="email"
              required
            />
          </div>

          <div className="g-field">
            <label htmlFor="profile-phone" className="g-label">
              Teléfono
            </label>
            <input
              id="profile-phone"
              className="g-input"
              type="tel"
              name="phone"
              defaultValue={phone}
              maxLength={30}
              autoComplete="tel"
              placeholder="Ej. +57 300 123 4567"
            />
          </div>
        </div>

        <SubmitButton
          className="g-btn g-btn--primary"
          pendingText="Guardando…"
        >
          Guardar cambios
        </SubmitButton>
      </form>

      <details
        className="g-card g-settings-collapse"
        open={Boolean(passwordErrorText)}
      >
        <summary className="g-settings-head g-settings-summary">
          <span
            className="g-settings-head-icon g-settings-head-icon--lilac"
            aria-hidden="true"
          >
            <LockIcon size={18} />
          </span>
          <div className="g-settings-head-text">
            <h3>Cambiar contraseña</h3>
            <p>Actualiza tu clave de acceso a BITA.</p>
          </div>
          <ChevronRightIcon size={18} className="g-settings-chevron" />
        </summary>

        <form action={changePasswordAction} className="g-settings-collapse-body">
          {passwordErrorText && (
            <div className="g-alert g-alert--error" role="alert">
              {passwordErrorText}
            </div>
          )}

          <div className="g-settings-fields">
            <div className="g-field">
              <label htmlFor="current-password" className="g-label">
                Contraseña actual *
              </label>
              <input
                id="current-password"
                className="g-input"
                type="password"
                name="currentPassword"
                minLength={8}
                maxLength={15}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="g-field">
              <label htmlFor="new-password" className="g-label">
                Nueva contraseña *
              </label>
              <input
                id="new-password"
                className="g-input"
                type="password"
                name="newPassword"
                minLength={8}
                maxLength={15}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="g-field">
              <label htmlFor="confirm-password" className="g-label">
                Confirmar nueva contraseña *
              </label>
              <input
                id="confirm-password"
                className="g-input"
                type="password"
                name="confirmPassword"
                minLength={8}
                maxLength={15}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <p className="g-help">
            De 8 a 15 caracteres: letras, números, espacios o guiones.
          </p>

          <SubmitButton
            className="g-btn g-settings-btn--secondary"
            pendingText="Actualizando…"
          >
            Actualizar contraseña
          </SubmitButton>
        </form>
      </details>

      {session.isWorkshop && (
        <Link href="/taller/perfil" className="g-card g-settings-row">
          <span className="g-settings-head-icon" aria-hidden="true">
            <WorkshopIcon size={18} />
          </span>
          <span className="g-settings-row-text">
            <strong>Perfil del taller</strong>
            <small>Nombre comercial, NIT y datos de contacto</small>
          </span>
          <ChevronRightIcon size={18} className="g-settings-chevron" />
        </Link>
      )}

      <form action={logoutAction} className="g-settings-logout">
        <SubmitButton
          className="g-btn g-btn--outline"
          pendingText="Cerrando sesión…"
        >
          <LogOutIcon size={18} />
          Cerrar sesión
        </SubmitButton>
      </form>

      <p className="g-settings-note">
        <LockIcon size={14} />
        Tu sesión dura 15 minutos por seguridad.
      </p>
    </section>
  );
}
