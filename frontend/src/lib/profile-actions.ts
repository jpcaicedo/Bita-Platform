'use server';

import { redirect } from 'next/navigation';
import { bitaFetch } from './bita-api';
import { requireSession } from './session';
import { isValidEmail, isValidPassword } from './validation';

const MAX_USERNAME = 60;
const MAX_PHONE = 30;

function volverAjustes(params: Record<string, string | undefined>): never {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, value);
  }

  const query = search.toString();
  redirect(query ? `/ajustes?${query}` : '/ajustes');
}

// Actualiza nombre visible, correo y teléfono del usuario autenticado.
export async function updateProfileAction(formData: FormData) {
  await requireSession();

  const username = String(formData.get('username') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const keep = { username, email, phone };

  if (username.length > MAX_USERNAME) {
    volverAjustes({ error: 'usuario', ...keep });
  }

  if (!isValidEmail(email)) {
    volverAjustes({ error: 'email', ...keep });
  }

  if (phone.length > MAX_PHONE) {
    volverAjustes({ error: 'telefono', ...keep });
  }

  const result = await bitaFetch('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify({ username, email, phone }),
    redirectOn401: false,
  });

  if (result.status === 0) {
    volverAjustes({ error: 'conexion', ...keep });
  }

  if (result.status === 401) {
    redirect('/login?expired=1');
  }

  if (result.status === 409) {
    volverAjustes({ error: 'existe', ...keep });
  }

  if (!result.ok) {
    volverAjustes({ error: 'datos', ...keep });
  }

  volverAjustes({ ok: 'perfil' });
}

// Cambia la contraseña verificando primero la actual.
export async function changePasswordAction(formData: FormData) {
  await requireSession();

  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    volverAjustes({ error: 'pass_campos' });
  }

  if (!isValidPassword(newPassword)) {
    volverAjustes({ error: 'pass_regla' });
  }

  if (newPassword !== confirmPassword) {
    volverAjustes({ error: 'pass_confirm' });
  }

  if (newPassword === currentPassword) {
    volverAjustes({ error: 'pass_igual' });
  }

  const result = await bitaFetch('/auth/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
    redirectOn401: false,
  });

  if (result.status === 0) {
    volverAjustes({ error: 'pass_conexion' });
  }

  if (result.status === 401) {
    volverAjustes({ error: 'pass_actual' });
  }

  if (!result.ok) {
    volverAjustes({ error: 'pass_datos' });
  }

  volverAjustes({ ok: 'password' });
}
