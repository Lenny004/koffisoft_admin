import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

import { createAuthHandle } from './auth-hook';

function eventFor(pathname: string, cookie: string | undefined, snapshot?: unknown): RequestEvent {
  const apiFetch = vi.fn(
    async () =>
      new Response(JSON.stringify(snapshot), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
  const cookies = {
    get: (name: string) => (name === 'session' ? cookie : undefined),
  };

  return {
    url: new URL(`http://localhost${pathname}`),
    request: new Request(`http://localhost${pathname}`, {
      headers: cookie ? { cookie } : undefined,
    }),
    cookies,
    fetch: apiFetch,
    locals: {},
  } as unknown as RequestEvent;
}

describe('hook de autenticación', () => {
  it('deja pública la pantalla de login sin sesión', async () => {
    const event = eventFor('/', undefined);
    const resolve = vi.fn(async () => new Response('login'));
    const handle = createAuthHandle({
      apiBaseUrl: 'http://api.test',
      sessionCookieName: 'session',
    });

    await handle({ event, resolve });

    expect(resolve).toHaveBeenCalledOnce();
    expect(event.locals.user).toBeUndefined();
  });

  it('carga usuario y permisos antes de resolver una ruta protegida', async () => {
    const event = eventFor('/productos', 'session=token', {
      user: { id: '1', username: 'admin', email: 'admin@example.com', status: 'active' },
      roles: ['admin'],
      permissions: ['catalog.read'],
      mfa: { enabled: true, verified: true },
    });
    const resolve = vi.fn(async () => new Response('products'));
    const handle = createAuthHandle({
      apiBaseUrl: 'http://api.test',
      sessionCookieName: 'session',
    });

    await handle({ event, resolve });

    expect(resolve).toHaveBeenCalledOnce();
    expect(event.locals.permissions).toEqual(['catalog.read']);
  });

  it('redirige al login cuando falta la sesión', async () => {
    const event = eventFor('/dashboard', undefined);
    const handle = createAuthHandle({
      apiBaseUrl: 'http://api.test',
      sessionCookieName: 'session',
    });

    await expect(handle({ event, resolve: vi.fn() })).rejects.toMatchObject({
      status: 303,
      location: expect.stringContaining('returnTo=%2Fdashboard'),
    });
  });

  it('rechaza una ruta cuando falta su permiso', async () => {
    const event = eventFor('/reportes', 'session=token', {
      user: { id: '1', username: 'viewer', email: 'viewer@example.com', status: 'active' },
      roles: ['viewer'],
      permissions: [],
      mfa: {},
    });
    const handle = createAuthHandle({
      apiBaseUrl: 'http://api.test',
      sessionCookieName: 'session',
    });

    await expect(handle({ event, resolve: vi.fn() })).rejects.toMatchObject({ status: 403 });
  });
});
