import { error, redirect } from '@sveltejs/kit';
import type { Handle, RequestEvent } from '@sveltejs/kit';

import { requiredPermissionForPath } from '$lib/config/navigation';
import type { AuthSnapshot, AuthenticatedUser } from '$lib/types/auth';

/** Consulta la sesión server-side y aplica el permiso asociado a cada módulo protegido. */
interface AuthHookOptions {
  apiBaseUrl: string;
  sessionCookieName: string;
  origin?: string;
}

export function isPublicPath(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/_app/') ||
    pathname.startsWith('/brand/') ||
    pathname.startsWith('/fixtures/') ||
    pathname === '/favicon.ico'
  );
}

function normalizeSnapshot(payload: unknown): AuthSnapshot | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const value = payload as Partial<AuthSnapshot>;
  if (!value.user || typeof value.user !== 'object') return undefined;

  const user = value.user as Partial<AuthenticatedUser>;
  if (typeof user.email !== 'string' || typeof user.username !== 'string') return undefined;

  return {
    user: {
      ...user,
      id: typeof user.id === 'string' ? user.id : '',
      username: user.username,
      email: user.email,
      status: typeof user.status === 'string' ? user.status : 'active',
    },
    roles: Array.isArray(value.roles)
      ? value.roles.filter((role): role is string => typeof role === 'string')
      : [],
    permissions: Array.isArray(value.permissions)
      ? value.permissions.filter(
          (permission): permission is string => typeof permission === 'string',
        )
      : [],
    mfa: value.mfa && typeof value.mfa === 'object' ? value.mfa : {},
  };
}

async function loadSnapshot(
  event: RequestEvent,
  options: AuthHookOptions,
): Promise<AuthSnapshot | undefined> {
  const cookie = event.request.headers.get('cookie');
  if (!cookie || !options.apiBaseUrl) return undefined;

  try {
    const headers = new Headers({ accept: 'application/json', cookie });
    headers.set('origin', options.origin || event.url.origin);
    const response = await event.fetch(`${options.apiBaseUrl.replace(/\/$/u, '')}/auth/me`, {
      headers,
    });
    if (!response.ok) return undefined;
    return normalizeSnapshot(await response.json());
  } catch {
    // El panel sigue sirviendo la pantalla pública de login si la API está apagada.
    return undefined;
  }
}

export function createAuthHandle(options: AuthHookOptions): Handle {
  return async ({ event, resolve }) => {
    const cookieName = options.sessionCookieName || 'session';
    const hasSessionCookie = Boolean(
      event.cookies.get(cookieName) || event.cookies.get(`__Host-${cookieName}`),
    );
    const snapshot = hasSessionCookie ? await loadSnapshot(event, options) : undefined;

    event.locals.user = snapshot?.user;
    event.locals.roles = snapshot?.roles ?? [];
    event.locals.permissions = snapshot?.permissions ?? [];
    event.locals.mfa = snapshot?.mfa;

    if (isPublicPath(event.url.pathname)) {
      if (event.url.pathname === '/' && snapshot) redirect(303, '/dashboard');
      return resolve(event);
    }

    if (!snapshot) {
      const returnTo = `${event.url.pathname}${event.url.search}`;
      redirect(303, `/?returnTo=${encodeURIComponent(returnTo)}`);
    }

    const requiredPermission = requiredPermissionForPath(event.url.pathname);
    if (requiredPermission && !snapshot.permissions.includes(requiredPermission)) {
      error(403, 'No tienes permisos para acceder a este módulo.');
    }

    return resolve(event);
  };
}
