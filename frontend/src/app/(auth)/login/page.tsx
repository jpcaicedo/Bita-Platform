import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { SubmitButton } from '@/components/ui/submit-button';
import { LockIcon, MailIcon } from '@/components/ui/icons';
import { loginAction } from '@/lib/auth-actions';
import '../auth.css';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
};

interface LoginParams {
  error?: string;
  expired?: string;
  registered?: string;
  email?: string;
}

interface Notice {
  kind: 'error' | 'ok' | 'info';
  text: string;
}

function loginNotice(params: LoginParams): Notice | null {
  if (params.error === '1') {
    return {
      kind: 'error',
      text: 'Correo o contraseña incorrectos. Inténtalo de nuevo.',
    };
  }
  if (params.error === 'conexion') {
    return {
      kind: 'error',
      text: 'El servidor está despertando, intenta de nuevo en unos segundos.',
    };
  }
  if (params.error === 'campos') {
    return { kind: 'error', text: 'Escribe tu correo y tu contraseña.' };
  }
  if (params.expired === '1') {
    return {
      kind: 'info',
      text: 'Tu sesión expiró, inicia sesión de nuevo.',
    };
  }
  if (params.registered === '1') {
    return {
      kind: 'ok',
      text: 'Tu cuenta fue creada. Ya puedes iniciar sesión.',
    };
  }
  return null;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginParams>;
}) {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<LoginParams>;
}) {
  const params = await searchParams;
  const notice = loginNotice(params);
  const email = params.email ?? '';

  return (
    <main className="g-auth">
      <Link href="/" className="g-auth-logo" aria-label="Volver a BITA">
        <Image
          src="/images/logo-b.svg"
          alt="BITA"
          fill
          priority
          sizes="46px"
        />
      </Link>

      <div className="g-auth-hero">
        <Image
          src="/images/car-login.svg"
          alt=""
          fill
          priority
          sizes="430px"
        />
      </div>

      <section className="g-auth-panel">
        <h1 className="g-auth-title">Bienvenido de Nuevo</h1>

        {notice && (
          <div className={`g-alert g-alert--${notice.kind}`} role="alert">
            {notice.text}
          </div>
        )}

        <form action={loginAction} className="g-auth-form">
          <div className="g-input-wrap">
            <label htmlFor="login-email" className="g-sr-only">
              Correo electrónico
            </label>
            <span className="g-input-icon">
              <MailIcon size={20} />
            </span>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className="g-sr-only">
              Contraseña
            </label>
            <span className="g-input-icon">
              <LockIcon size={20} />
            </span>
            <input
              id="login-password"
              className="g-input"
              type="password"
              name="password"
              placeholder="Contraseña"
              autoComplete="current-password"
              required
            />
          </div>

          <SubmitButton pendingText="Ingresando…">Continuar</SubmitButton>
        </form>

        <p className="g-auth-foot">
          ¿No tienes una cuenta?{' '}
          <Link href="/registro" className="g-link">
            Regístrate
          </Link>
        </p>
      </section>
    </main>
  );
}

function LoginSkeleton() {
  return (
    <main className="g-auth" aria-busy="true">
      <div className="g-auth-hero g-skeleton" />
      <section className="g-auth-panel">
        <div className="g-skeleton" style={{ height: 30, width: '75%' }} />
        <div
          className="g-skeleton"
          style={{ height: 54, marginTop: 24, borderRadius: 999 }}
        />
        <div
          className="g-skeleton"
          style={{ height: 54, marginTop: 12, borderRadius: 999 }}
        />
        <div
          className="g-skeleton"
          style={{ height: 52, marginTop: 24, borderRadius: 999 }}
        />
      </section>
    </main>
  );
}
