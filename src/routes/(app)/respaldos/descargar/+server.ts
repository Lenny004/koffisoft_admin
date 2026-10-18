import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

import { apiErrorMessage, apiRequest } from '$lib/server/api';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

/** Descarga el archivo del respaldo reenviando cabeceras de la API tras validar permiso y UUID. */
export const GET: RequestHandler = async (event) => {
  if (!event.locals.permissions.includes('backups.download')) {
    return new Response('No tienes permiso para descargar respaldos.', { status: 403 });
  }
  const id = event.url.searchParams.get('id') ?? '';
  if (!UUID_PATTERN.test(id))
    return new Response('El respaldo seleccionado no es válido.', { status: 400 });
  if (!env.API_BASE_URL) return new Response('La API no está configurada.', { status: 503 });

  const response = await apiRequest(
    event,
    `/backups/admin/${encodeURIComponent(id)}/download`,
    env.API_BASE_URL,
  );
  if (!response.ok) {
    return new Response(await apiErrorMessage(response), {
      status: response.status,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }

  const headers = new Headers();
  for (const name of [
    'content-type',
    'content-disposition',
    'content-length',
    'cache-control',
    'x-backup-sha256',
  ]) {
    const value = response.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(response.body, { status: 200, headers });
};
