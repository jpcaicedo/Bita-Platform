'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { bitaFetch } from './bita-api';
import { requireOwner } from './session';

// Marcar todas como leídas: POST /notifications/read
export async function markNotificationsReadAction() {
  await requireOwner();

  const result = await bitaFetch('/notifications/read', { method: 'POST' });

  if (!result.ok) redirect('/notificaciones?error=1');

  // 'layout' refresca también el número de la campana del encabezado.
  revalidatePath('/', 'layout');
  redirect('/notificaciones');
}
