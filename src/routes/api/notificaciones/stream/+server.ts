import { env } from '$env/dynamic/private';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Reenvía el SSE autenticado de la API conservando la cookie HttpOnly. */
export const GET: RequestHandler = async (event) => {
  const apiBaseUrl = (env.API_BASE_URL ?? '').replace(/\/$/u, '');
  if (!apiBaseUrl) error(503, 'La API no está configurada.');

  const headers = new Headers({ accept: 'text/event-stream' });
  const storedCookies = event.cookies.getAll();
  const cookie = storedCookies.length
    ? storedCookies.map(({ name, value }) => `${name}=${value}`).join('; ')
    : event.request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  const origin = env.ORIGIN || event.request.headers.get('origin') || event.url.origin;
  headers.set('origin', origin);
  headers.set('referer', event.request.headers.get('referer') || `${origin}${event.url.pathname}`);

  const response = await event.fetch(`${apiBaseUrl}/notifications/stream`, { headers });
  if (!response.ok || !response.body) {
    error(response.status >= 400 ? response.status : 502, 'No se pudo abrir el flujo de alertas.');
  }

  return new Response(response.body, {
    headers: {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  });
};
