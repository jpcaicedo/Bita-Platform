import { requireOwner } from '@/lib/session';
import './notificaciones.css';

// Igual que los layouts del garaje y del taller: lee la sesión en cada request.
export const instant = false;

// Las notificaciones salen de los recordatorios, que son del dueño.
// Si un taller entra aquí, requireOwner() lo manda a /taller.
export default async function NotificacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner();
  return <section className="g-notif">{children}</section>;
}
