import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { SubmitButton } from '@/components/ui/submit-button';
import { LockIcon, MailIcon, UserIcon } from '@/components/ui/icons';
import { registerAction } from '@/lib/auth-actions';
import '../auth.css';

export const metadata: Metadata = {
  title: 'Crear cuenta',
};

interface RegisterParams {
  error?: string;
  email?: string;
  username?: string;
  tipo?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  campos: 'Completa todos los campos para crear tu cuenta.',
  usuario:
    'El nombre de usuario es obligatorio y debe tener máximo 60 caracteres.',
  email: 'Escribe un correo electrónico válido.',
  password_regla:
    'La contraseña debe tener entre 8 y 15 caracteres y solo puede usar letras, números, espacios o guiones.',
  confirm: 'Las contraseñas no coinciden.',
  tipo: 'Selecciona el tipo de cuenta.',
  exists: 'Ya existe una cuenta con ese email.',
  conexion:
    'El servidor está despertando, intenta de nuevo en unos segundos.',
  validacion: 'Revisa los datos: el servidor rechazó el registro.',
};

export default function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<RegisterParams>;
}) {
  return (
    <Suspense fallback={<RegisterSkeleton />}>
      <RegisterContent searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterContent({
  searchParams,
}: {
  searchParams: Promise<RegisterParams>;
}) {
  const params = await searchParams;
  const errorText = params.error
    ? ERROR_MESSAGES[params.error] ?? ERROR_MESSAGES.validacion
    : null;
  const email = params.email ?? '';
  const username = params.username ?? '';
  const tipo = params.tipo ?? '';

  return (
    <main className="g-auth g-signup">
      <Link href="/" className="g-auth-logo" aria-label="Volver a BITA">
        <Image
          src="/images/logo-b.svg"
          alt="BITA"
          fill
          priority
          sizes="46px"
        />
      </Link>

      <div className="g-auth-hero g-signup-hero">
        <Image
          src="/images/signup-car.png"
          alt=""
          fill
          priority
          sizes="430px"
        />
      </div>

      <section className="g-auth-panel g-signup-panel">
        <h1 className="g-auth-title">Comencemos</h1>

        {errorText && (
          <div className="g-alert g-alert--error" role="alert">
            {errorText}
          </div>
        )}

        <form action={registerAction} className="g-auth-form">
          <div className="g-input-wrap">
            <label htmlFor="reg-username" className="g-sr-only">
              Nombre de usuario
            </label>
            <span className="g-input-icon">
              <UserIcon size={20} />
            </span>
            <input
              id="reg-username"
              className="g-input"
              type="text"
              name="username"
              placeholder="Nombre de usuario"
              defaultValue={username}
              maxLength={60}
              autoComplete="username"
              required
            />
          </div>

          <div className="g-input-wrap">
            <label htmlFor="reg-email" className="g-sr-only">
              Correo electrónico
            </label>
            <span className="g-input-icon">
              <MailIcon size={20} />
            </span>
            <input
              id="reg-email"
              className="g-input"
              type="email"
              name="email"
              placeholder="Correo electrónico"
              defaultValue={email}
              autoComplete="email"
              required
            />
          </div>

          <div className="g-input-wrap">
            <label htmlFor="reg-password" className="g-sr-only">
              Contraseña
            </label>
            <span className="g-input-icon">
              <LockIcon size={20} />
            </span>
            <input
              id="reg-password"
              className="g-input"
              type="password"
              name="password"
              placeholder="Contraseña"
              minLength={8}
              maxLength={15}
              autoComplete="new-password"
              aria-describedby="reg-password-help"
              required
            />
          </div>
          <p id="reg-password-help" className="g-help g-password-help">
            De 8 a 15 caracteres: letras, números, espacios o guiones.
          </p>

          <div className="g-input-wrap">
            <label htmlFor="reg-confirm" className="g-sr-only">
              Confirmar contraseña
            </label>
            <span className="g-input-icon">
              <LockIcon size={20} />
            </span>
            <input
              id="reg-confirm"
              className="g-input"
              type="password"
              name="confirmPassword"
              placeholder="Confirmar contraseña"
              minLength={8}
              maxLength={15}
              autoComplete="new-password"
              required
            />
          </div>

          <fieldset className="g-account">
            <legend className="g-label">Tipo de cuenta:</legend>
            <div className="g-account-options">
              <label className="g-account-option">
                <input
                  type="radio"
                  name="accountType"
                  value="taller"
                  defaultChecked={tipo === 'taller'}
                  required
                />
                <span>Taller</span>
              </label>
              <label className="g-account-option">
                <input
                  type="radio"
                  name="accountType"
                  value="dueno"
                  defaultChecked={tipo === 'dueno'}
                  required
                />
                <span>Dueño</span>
              </label>
            </div>
          </fieldset>

          <SubmitButton pendingText="Creando cuenta…">
            Crear Cuenta
          </SubmitButton>
        </form>

        <div className="g-auth-sep">O</div>

        {/* Solo UI: el backend no tiene OAuth de Google. */}
        <button
          type="button"
          className="g-btn g-btn--google"
          disabled
          title="Próximamente"
        >
          <span className="g-google-g" aria-hidden="true">
            G
          </span>
          Registrarse con Google
        </button>

        <p className="g-auth-foot">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="g-link">
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}

function RegisterSkeleton() {
  return (
    <main className="g-auth g-signup" aria-busy="true">
      <div className="g-auth-hero g-signup-hero g-skeleton" />
      <section className="g-auth-panel g-signup-panel">
        <div className="g-skeleton" style={{ height: 30, width: '60%' }} />
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="g-skeleton"
            style={{ height: 54, marginTop: 12, borderRadius: 999 }}
          />
        ))}
        <div
          className="g-skeleton"
          style={{ height: 52, marginTop: 18, borderRadius: 999 }}
        />
      </section>
    </main>
  );
}
