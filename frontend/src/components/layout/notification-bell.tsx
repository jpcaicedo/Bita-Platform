import Link from 'next/link';
import { BellIcon } from '@/components/ui/icons';
import { getUnreadNotificationsCount } from '@/lib/notificaciones';
import { getSession } from '@/lib/session';

// Campana con el número de notificaciones sin leer. Es un Server Component:
// el layout se la pasa al AppFrame (cliente) y el garaje la pinta en su saludo.
// Los talleres no reciben recordatorios, así que a ellos no se les muestra.
export async function NotificationBell() {
  const session = await getSession();
  if (!session || session.isWorkshop) return null;

  const unread = await getUnreadNotificationsCount();
  const count = unread.ok ? (unread.data?.count ?? 0) : 0;

  return (
    <Link
      href="/notificaciones"
      className="g-app-bell"
      aria-label={
        count > 0 ? `Notificaciones: ${count} sin leer` : 'Notificaciones'
      }
    >
      <BellIcon size={20} />
      {count > 0 && (
        <span className="g-app-bell-badge">{count > 9 ? '9+' : count}</span>
      )}
    </Link>
  );
}
