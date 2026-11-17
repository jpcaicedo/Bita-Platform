import type { Metadata } from 'next';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { getSession, homeFor } from '@/lib/session';
import './splash.css';

export const metadata: Metadata = {
  title: 'Bienvenido',
};

// El splash solo decide a dónde ir. La imagen se muestra como fallback
// mientras se lee la cookie, que es un dato de request (por eso Suspense).
export default function SplashPage() {
  return (
    <Suspense fallback={<SplashVisual />}>
      <SplashGate />
    </Suspense>
  );
}

async function SplashGate() {
  const cookieStore = await cookies();
  const token = cookieStore.get('bita_token')?.value;

  if (token) {
    const session = await getSession();

    if (!session) redirect('/login?error=conexion');

    redirect(homeFor(session));
  }

  // Sin sesión siempre se muestra el onboarding; solo después de recorrerlo
  // (o de pulsar "Omitir") se llega al login.
  return <SplashVisual autoAdvance />;
}

function SplashVisual({ autoAdvance = false }: { autoAdvance?: boolean }) {
  return (
    <main className="g-splash">
      {/* Sin JS: el navegador avanza solo. La animación dura ~3 s y el
          desvanecido otros 0.7 s antes de entrar al onboarding. */}
      {autoAdvance && (
        <meta httpEquiv="refresh" content="4;url=/bienvenida" />
      )}

      <div className="g-splash-brand">
        <div className="g-splash-logo">
          <Image
            src="/images/logo-bita.svg"
            alt="BITA"
            fill
            priority
            sizes="300px"
          />
        </div>
      </div>
    </main>
  );
}
