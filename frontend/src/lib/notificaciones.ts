import type { ReminderNotification } from '@/types/notification';
import { bitaFetch, type BitaResponse } from './bita-api';

/**
 * Lecturas de las notificaciones de recordatorios del dueño. Igual que
 * lib/garaje.ts: usan bitaFetch, así que solo corren en el servidor.
 */
export function getNotifications(): Promise<
  BitaResponse<ReminderNotification[]>
> {
  return bitaFetch<ReminderNotification[]>('/notifications');
}

export function getUnreadNotificationsCount(): Promise<
  BitaResponse<{ count: number }>
> {
  return bitaFetch<{ count: number }>('/notifications/unread-count', {
    redirectOn401: false,
  });
}

// "Hace 5 min", "Hace 3 h", "Ayer" o la fecha corta.
export function tiempoRelativo(isoDate: string): string {
  const minutos = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / 60000,
  );

  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  if (horas < 48) return 'Ayer';

  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(isoDate));
}
