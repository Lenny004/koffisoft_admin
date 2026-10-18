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

  it('lista mantenimientos globales con filtros de historial', async () => {
    const { event, fetch } = eventFor(
      new Response(
        JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }),
        { status: 200 },
      ),
    );
    await createResourcesClient(event, 'http://api.test').listMaintenances({
      locationId: 'location-1',
      completed: false,
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      page: 2,
      pageSize: 20,
    });
    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/resources/admin/maintenance?');
    expect(url).toContain('locationId=location-1');
    expect(url).toContain('completed=false');
    expect(url).toContain('dateFrom=2026-01-01');
    expect(url).toContain('dateTo=2026-12-31');
    expect(url).toContain('page=2');
  });

  it('lista el historial de un recurso concreto', async () => {
    const { event, fetch } = eventFor(
      new Response(
        JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }),
        { status: 200 },
      ),
    );
    await createResourcesClient(event, 'http://api.test').listResourceMaintenances('resource-1', {
      locationId: 'location-1',
      completed: true,
    });
    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'http://api.test/resources/admin/resource-1/maintenance?locationId=location-1&completed=true',
    );
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
