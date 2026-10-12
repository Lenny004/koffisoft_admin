import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

/** Cliente BFF: conserva cookies HttpOnly y envía el origen que la API usa para CSRF. */
export interface ApiRequestOptions extends RequestInit {
  json?: unknown;
}

export class ApiNotConfiguredError extends Error {
  constructor() {
    super('El panel no tiene configurada la API. Sin API_BASE_URL no es posible iniciar sesión.');
    this.name = 'ApiNotConfiguredError';
  }
}

/** Los fallos de formulario solo aceptan 4xx o 5xx; una redirección no es un error de la API. */
export function actionErrorStatus(status: number): number {
  return status >= 400 && status <= 599 ? status : 502;
}

export function connectionErrorMessage(error: unknown): string {
  if (error instanceof ApiNotConfiguredError) return error.message;
  return 'No fue posible conectar con la API de autenticación.';
}

export async function apiRequest(
  event: RequestEvent,
  path: string,
  apiBaseUrl: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const baseUrl = apiBaseUrl.replace(/\/$/u, '');
  if (!baseUrl) throw new ApiNotConfiguredError();

  const headers = new Headers(options.headers);
  headers.set('accept', 'application/json');

  const storedCookies = event.cookies.getAll();
  const cookie = storedCookies.length
    ? storedCookies.map(({ name, value }) => `${name}=${value}`).join('; ')
    : event.request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  const origin = env.ORIGIN || event.request.headers.get('origin') || event.url.origin;
  headers.set('origin', origin);
  headers.set('referer', event.request.headers.get('referer') || `${origin}${event.url.pathname}`);

  let body = options.body;
  if (options.json !== undefined) {
    headers.set('content-type', 'application/json');
    body = JSON.stringify(options.json);
  }

  const requestOptions = { ...options };
  delete requestOptions.json;
  return event.fetch(`${baseUrl}${path}`, {
    ...requestOptions,
    body,
    headers,
  });
}

export async function apiErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message) && payload.message.length) return payload.message.join(' ');
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message;
  } catch {
    // El cuerpo puede estar vacío cuando la respuesta es una redirección o HTML.
  }

  if (response.status >= 300 && response.status < 400) {
    return 'La solicitud no llegó a la API. Revisa que API_BASE_URL apunte a koffisoft_api y no al propio panel.';
  }
  if (response.status === 401) return 'El correo o la contraseña no son correctos.';
  if (response.status === 403) return 'No tienes permiso para continuar.';
  if (response.status === 429)
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
  if (response.status >= 500)
    return 'El servicio de autenticación no está disponible en este momento.';
  return 'No se pudo completar la solicitud. Inténtalo de nuevo.';
}

export async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function setCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const cookies = headers.getSetCookie?.();
  return cookies?.length
    ? cookies
    : (response.headers.get('set-cookie')?.split(/,(?=[^;]+=[^;]+)/u) ?? []);
}

export function forwardSessionCookies(
  event: RequestEvent,
  response: Response,
  secure: boolean,
): void {
  for (const setCookie of setCookieHeaders(response)) {
    const [pair, ...attributes] = setCookie.split(';').map((part) => part.trim());
    const separator = pair.indexOf('=');
    if (separator < 1) continue;

    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    const maxAge = attributes.find((attribute) => /^max-age=/iu.test(attribute));
    const expires = attributes.find((attribute) => /^expires=/iu.test(attribute));

    if (!value || maxAge?.toLowerCase() === 'max-age=0') {
      event.cookies.delete(name, { path: '/' });
      continue;
    }

    event.cookies.set(name, value, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure,
      ...(maxAge ? { maxAge: Number(maxAge.slice('max-age='.length)) } : {}),
      ...(expires ? { expires: new Date(expires.slice('expires='.length)) } : {}),
    });
  }
}

export function clearSessionCookie(event: RequestEvent, cookieName: string): void {
  event.cookies.delete(cookieName, { path: '/' });
  if (!cookieName.startsWith('__Host-'))
    event.cookies.delete(`__Host-${cookieName}`, { path: '/' });
}
