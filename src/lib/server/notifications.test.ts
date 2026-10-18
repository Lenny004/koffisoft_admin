import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import { createNotificationsClient, NotificationsApiError } from './notifications';

const adminOrigin = env.ORIGIN || 'http://admin.test';

function eventFor(response: Response): { event: RequestEvent; fetch: ReturnType<typeof vi.fn> } {
  const fetch = vi.fn(async () => response);
  const event = {
    url: new URL(`${adminOrigin}/notificaciones`),
    request: new Request(`${adminOrigin}/notificaciones`, {
      headers: { cookie: 'session=abc' },
    }),
    cookies: { getAll: () => [{ name: 'session', value: 'abc' }] },
    fetch,
  } as unknown as RequestEvent;
  return { event, fetch };
}

describe('cliente server-side de notificaciones', () => {
  it('lista con filtros de no leídas, tipo y severidad', async () => {
    const { event, fetch } = eventFor(
      new Response(
        JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

    await createNotificationsClient(event, 'http://api.test/').list({
      page: 1,
      pageSize: 20,
      unreadOnly: true,
      notificationType: 'LowStock',
      severity: 'Warning',
    });

    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/notifications?');
    expect(url).toContain('unreadOnly=true');
    expect(url).toContain('notificationType=LowStock');
    expect(url).toContain('severity=Warning');
  });

  it('marca todas como leídas cuando no hay id', async () => {
    const { event, fetch } = eventFor(new Response('{}', { status: 200 }));
    await createNotificationsClient(event, 'http://api.test').markRead();
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/notifications/mark-read');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({}));
  });

  it('expone el estado HTTP como error del cliente', async () => {
    const { event } = eventFor(
      new Response(JSON.stringify({ message: 'Sin permiso.' }), { status: 403 }),
    );
    await expect(createNotificationsClient(event, 'http://api.test').unreadCount()).rejects.toBeInstanceOf(
      NotificationsApiError,
    );
  });
});
