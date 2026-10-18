import { env } from '$env/dynamic/private';

import { createAuthHandle } from '$lib/server/auth-hook';

/** Encadena sesión, permisos y redirecciones de auth en cada petición del panel. */
export const handle = createAuthHandle({
  apiBaseUrl: env.API_BASE_URL ?? '',
  origin: env.ORIGIN,
  sessionCookieName: env.SESSION_COOKIE_NAME ?? 'koffisoft_session',
});
