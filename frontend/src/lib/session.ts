import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { AuthUser } from '@/types/auth';
import type { WorkshopProfile } from '@/types/workshop';
import { bitaFetch } from './bita-api';

export interface Session {
  user: AuthUser;
  isWorkshop: boolean;
  workshop: WorkshopProfile | null;
}

/**
 * Lee la sesión del request actual:
 * 1. toma la cookie httpOnly bita_token,
 * 2. pide GET /auth/me,
 * 3. pide GET /workshops/me para saber si el usuario es taller.
 *
 * El rol es implícito: si /workshops/me responde 200, es taller; si responde
 * 404, es dueño. cache() evita repetir esas dos llamadas en el mismo request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get('bita_token')?.value;

  if (!token) return null;

  const me = await bitaFetch<AuthUser>('/auth/me');

  if (!me.ok || !me.data) return null;

  const workshop = await bitaFetch<WorkshopProfile>('/workshops/me', {
    redirectOn401: false,
  });

  return {
    user: me.data,
    isWorkshop: workshop.ok && workshop.data !== null,
    workshop: workshop.ok ? workshop.data : null,
  };
});

// Exige sesión; si no hay, manda al login.
export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) redirect('/login');

  return session;
}

// Rutas del dueño: si un taller intenta entrar, vuelve a su panel.
export async function requireOwner(): Promise<Session> {
  const session = await requireSession();

  if (session.isWorkshop) redirect('/taller');

  return session;
}

// Rutas del taller: si un dueño intenta entrar, vuelve a su garaje.
export async function requireWorkshop(): Promise<Session> {
  const session = await requireSession();

  if (!session.isWorkshop) redirect('/garaje');

  return session;
}

// Home según el rol. Lo usa el login después de guardar la cookie.
export function homeFor(session: Session): '/taller' | '/garaje' {
  return session.isWorkshop ? '/taller' : '/garaje';
}
