import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { BellIcon, ChevronRightIcon } from '@/components/ui/icons';
import { SubmitButton } from '@/components/ui/submit-button';
import { getNotifications, tiempoRelativo } from '@/lib/notificaciones';
import { markNotificationsReadAction } from '@/lib/notificaciones-actions';

export const metadata: Metadata = {
  title: 'Notificaciones',
};

// Avisos de los recordatorios: los genera el backend cuando un
// recordatorio entra en su margen (próximo) o se pasa (vencido).
export default function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <Suspense fallback={<NotificationsSkeleton />}>
      <NotificationsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function NotificationsContent({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const notifications = await getNotifications();

  if (!notifications.ok || !notifications.data) {
    return (
      <p className="g-alert g-alert--error" role="alert">
        No pudimos cargar tus notificaciones. Inténtalo de nuevo en unos
        segundos.
      </p>
    );
  }

  const lista = notifications.data;
  const sinLeer = lista.filter((item) => item.readAt === null).length;

  return (
    <>
      <header className="g-notif-head">
        <p>
          {sinLeer > 0
            ? `Tienes ${sinLeer} ${sinLeer === 1 ? 'aviso nuevo' : 'avisos nuevos'}.`
            : 'Estás al día con tus avisos.'}
        </p>
        {sinLeer > 0 && (
          <form action={markNotificationsReadAction}>
            <SubmitButton pendingText="Marcando…" className="g-notif-read-all">
              Marcar todas como leídas
            </SubmitButton>
          </form>
        )}
      </header>

      {error && (
        <p className="g-alert g-alert--error" role="alert">
          No pudimos marcar las notificaciones. Inténtalo otra vez.
        </p>
      )}

      {lista.length === 0 ? (
        <section className="g-notif-empty">
          <span className="g-notif-empty-icon" aria-hidden="true">
            <BellIcon size={26} />
          </span>
          <h3>Sin notificaciones</h3>
          <p>
            Cuando un recordatorio esté por vencer o se pase, te avisaremos
            aquí.
          </p>
        </section>
      ) : (
        <ul className="g-notif-list">
          {lista.map((item) => {
            const vencido = item.notificationType === 'overdue';
            const { reminder } = item;

            return (
              <li key={item.id}>
                <Link
                  href={`/garaje/${reminder.vehicle.id}/recordatorios`}
                  className={`g-notif-item ${
                    item.readAt === null ? 'g-notif-item--unread' : ''
                  }`}
                >
                  <span
                    className={`g-notif-dot g-notif-dot--${item.notificationType}`}
                    aria-hidden="true"
                  >
                    <BellIcon size={16} />
                  </span>
                  <span className="g-notif-body">
                    <strong>
                      {reminder.title}{' '}
                      {vencido ? 'está vencido' : 'vence pronto'}
                    </strong>
                    <span>
                      {reminder.vehicle.brand} {reminder.vehicle.model} ·{' '}
                      {reminder.vehicle.plate}
                    </span>
                    <small>{tiempoRelativo(item.scheduledFor)}</small>
                  </span>
                  <ChevronRightIcon size={16} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function NotificationsSkeleton() {
  return (
    <div aria-busy="true">
      <div
        className="g-skeleton"
        style={{ height: 20, width: '60%', marginBottom: 16 }}
      />
      <div
        className="g-skeleton"
        style={{ height: 76, borderRadius: 20, marginBottom: 10 }}
      />
      <div className="g-skeleton" style={{ height: 76, borderRadius: 20 }} />
    </div>
  );
}
