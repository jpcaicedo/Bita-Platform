import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// URL de la API. En local apunta al NestJS del puerto 3000; en producción a Render.
const API_URL =
  process.env.BITA_API_URL ?? 'https://bita-api-gz56.onrender.com/api';

export interface BitaResponse<T> {
  ok: boolean;
  status: number;
  data: T | null;
  message: string | null;
}

export interface BitaFetchOptions extends RequestInit {
  // Las llamadas de login/registro no deben redirigir por un 401: ese 401
  // significa "credenciales inválidas" y la acción decide qué mostrar.
  redirectOn401?: boolean;
  // Token explícito para acciones que acaban de iniciar sesión y todavía
  // necesitan consultar el rol antes de que la cookie viaje en otro request.
  token?: string;
}

/**
 * Cliente único de la API. Lee el JWT de la cookie httpOnly y agrega el
 * header Authorization. No lanza excepciones por respuestas 4xx: devuelve el
 * status para que la página o la server action decida. Un fallo de red
 * (servidor dormido, sin internet) se representa con status 0.
 */
export async function bitaFetch<T>(
  path: string,
  options: BitaFetchOptions = {},
): Promise<BitaResponse<T>> {
  const { redirectOn401 = true, token: explicitToken, ...init } = options;
  const token =
    explicitToken ?? (await cookies()).get('bita_token')?.value;
  const headers = new Headers(init.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      // Render gratuito tarda ~50 s en despertar; damos margen suficiente.
      signal: AbortSignal.timeout(65000),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      data: null,
      message: 'No se pudo conectar con el servidor',
    };
  }

  // En esta versión de Next no se pueden borrar cookies al renderizar.
  // Por eso solo redirigimos: el login sobrescribe la cookie vencida.
  if (response.status === 401 && redirectOn401) {
    redirect('/login?expired=1');
  }

  let data: T | null = null;

  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
    message: extractApiMessage(data),
  };
}

/**
 * Los 400 de NestJS traen `message` como texto o como arreglo de textos.
 * Devuelve siempre un string para poder mostrarlo en la interfaz.
 */
export function extractApiMessage(
  data: unknown,
  fallback = 'Ocurrió un error inesperado',
): string {
  if (!data || typeof data !== 'object') return fallback;

  const message = (data as { message?: unknown }).message;

  if (Array.isArray(message)) {
    const texts = message.filter(
      (item): item is string => typeof item === 'string',
    );
    return texts.length > 0 ? texts.join('. ') : fallback;
  }

  return typeof message === 'string' ? message : fallback;
}
