import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SubmitButton } from '@/components/ui/submit-button';
import { UserIcon } from '@/components/ui/icons';
import { logoutAction } from '@/lib/auth-actions';
import { requireSession } from '@/lib/session';
import './ajustes.css';

export const metadata: Metadata = {
  title: 'Ajustes',
};

export default function AjustesPage() {
  return (
    <Suspense fallback={<div className="g-skeleton g-settings-skeleton" />}>
      <AjustesContent />
    </Suspense>
  );
}

async function AjustesContent() {
  const session = await requireSession();
  const role = session.isWorkshop ? 'Taller' : 'Dueño';
  const displayName = session.user.username || 'Usuario BITA';

  return (
    <section className="g-settings">
      <article className="g-card g-settings-card">
        <span className="g-settings-avatar" aria-hidden="true">
          <UserIcon size={30} />
        </span>

        <h2 className="g-settings-name">{displayName}</h2>
        <p className="g-settings-email">{session.user.email}</p>

        <span className="g-pill g-pill--blue">Rol: {role}</span>

        {session.workshop && (
          <p className="g-settings-workshop">{session.workshop.name}</p>
        )}
      </article>

      <form action={logoutAction} className="g-settings-logout">
        <SubmitButton
          className="g-btn g-btn--outline"
          pendingText="Cerrando sesión…"
        >
          Cerrar sesión
        </SubmitButton>
      </form>

      <p className="g-settings-note">
        Tu sesión dura 15 minutos por seguridad. Si expira, vuelve a iniciar
        sesión.
      </p>
    </section>
  );
}
