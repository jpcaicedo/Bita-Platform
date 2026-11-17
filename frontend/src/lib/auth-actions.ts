'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { LoginResponse, RegisterResponse } from '@/types/auth';
import type { WorkshopProfile } from '@/types/workshop';
import { bitaFetch } from './bita-api';
import { isValidEmail, isValidPassword } from './validation';

const TOKEN_COOKIE = 'bita_token';

// El JWT dura 15 minutos: la cookie usa el mismo maxAge.
const TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 15 * 60,
};

function withParams(
  path: string,
  params: Record<string, string | undefined>,
): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

// Conserva el email y el usuario escritos, nunca la contraseña.
function backToRegister(
  error: string,
  data: { email?: string; username?: string; tipo?: string },
): never {
  redirect(withParams('/registro', { error, ...data }));
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect(withParams('/login', { error: 'campos', email }));
  }

  const result = await bitaFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    redirectOn401: false,
  });

  if (result.status === 0) {
    redirect(withParams('/login', { error: 'conexion', email }));
  }

  if (!result.ok || !result.data?.access_token) {
    redirect(withParams('/login', { error: '1', email }));
  }

  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, result.data.access_token, TOKEN_COOKIE_OPTIONS);

  // El rol no viene en el JWT: se detecta preguntando por el perfil de taller.
  const workshop = await bitaFetch<WorkshopProfile>('/workshops/me', {
    redirectOn401: false,
    token: result.data.access_token,
  });

  redirect(workshop.ok ? '/taller' : '/garaje');
}

export async function registerAction(formData: FormData) {
  const username = String(formData.get('username') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const accountType = String(formData.get('accountType') ?? '');
  const keep = { email, username, tipo: accountType };

  if (!username || !email || !password || !confirmPassword || !accountType) {
    backToRegister('campos', keep);
  }

  if (username.length > 60) {
    backToRegister('usuario', keep);
  }

  if (!isValidEmail(email)) {
    backToRegister('email', keep);
  }

  if (!isValidPassword(password)) {
    backToRegister('password_regla', keep);
  }

  if (password !== confirmPassword) {
    backToRegister('confirm', keep);
  }

  if (accountType !== 'taller' && accountType !== 'dueno') {
    backToRegister('tipo', keep);
  }

  const registered = await bitaFetch<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, username }),
    redirectOn401: false,
  });

  if (registered.status === 0) {
    backToRegister('conexion', keep);
  }

  if (registered.status === 409) {
    backToRegister('exists', keep);
  }

  if (!registered.ok) {
    backToRegister('validacion', keep);
  }

  if (accountType === 'dueno') {
    redirect('/login?registered=1');
  }

  // Cuenta de taller: iniciar sesión automáticamente y crear su perfil.
  const login = await bitaFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    redirectOn401: false,
  });

  if (!login.ok || !login.data?.access_token) {
    redirect(
      withParams('/login', {
        error: login.status === 0 ? 'conexion' : '1',
        email,
      }),
    );
  }

  const token = login.data.access_token;
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, TOKEN_COOKIE_OPTIONS);

  const profile = await bitaFetch<WorkshopProfile>('/workshops', {
    method: 'POST',
    body: JSON.stringify({ name: username }),
    redirectOn401: false,
    token,
  });

  if (!profile.ok) {
    redirect('/taller/perfil?completar=1');
  }

  redirect('/taller');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  redirect('/login');
}

// "Omitir" y "¡Entendido!" del onboarding.
export async function completeOnboardingAction() {
  redirect('/login');
}
