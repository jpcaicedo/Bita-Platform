import { Suspense } from 'react';
import { AppFrame } from '@/components/layout/app-frame';
import { requireSession } from '@/lib/session';

// Leer la cookie de sesión siempre bloquea: no puede formar parte del shell
// estático. Con este opt-out evitamos que Next lo marque como error de
// navegación instantánea; las páginas siguen envueltas en <Suspense>.
export const instant = false;

// Con cacheComponents activo, leer cookies debe ocurrir dentro de <Suspense>.
// El layout protege todo el grupo (app) y pinta encabezado + barra inferior.
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="g-app-loading">
          <div className="g-skeleton g-app-loading-card" />
        </div>
      }
    >
      <ProtectedShell>{children}</ProtectedShell>
    </Suspense>
  );
}

async function ProtectedShell({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <AppFrame role={session.isWorkshop ? 'workshop' : 'owner'}>
      {children}
    </AppFrame>
  );
}
