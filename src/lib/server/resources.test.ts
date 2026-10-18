import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import { createResourcesClient } from './resources';

const adminOrigin = env.ORIGIN || 'http://admin.test';

function eventFor(response: Response): { event: RequestEvent; fetch: ReturnType<typeof vi.fn> } {
  const fetch = vi.fn(async () => response);
  const event = {
    url: new URL(`${adminOrigin}/recursos`),
    request: new Request(`${adminOrigin}/recursos`, { headers: { cookie: 'session=abc' } }),
    cookies: { getAll: () => [{ name: 'session', value: 'abc' }] },
    fetch,
  } as unknown as RequestEvent;
  return { event, fetch };
}

describe('cliente server-side de recursos', () => {
  it('lista recursos con sede y categoría', async () => {
    const { event, fetch } = eventFor(
      new Response(
        JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }),
        { status: 200 },
      ),
    );
    await createResourcesClient(event, 'http://api.test').list({
      locationId: 'location-1',
      category: 'Equipment',
      includeInactive: true,
    });
    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/resources/admin?');
    expect(url).toContain('locationId=location-1');
    expect(url).toContain('category=Equipment');
  });

  it('completa un mantenimiento programado', async () => {
    const { event, fetch } = eventFor(new Response('{}', { status: 200 }));
    await createResourcesClient(event, 'http://api.test').completeMaintenance('sched-1', {
      notes: 'Listo',
    });
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/resources/admin/maintenance/sched-1/complete');
    expect(init.method).toBe('PATCH');
  });
});
