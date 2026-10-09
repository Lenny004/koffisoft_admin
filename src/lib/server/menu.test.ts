import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

import { createMenuClient, MenuApiError } from './menu';

function eventFor(response: Response): { event: RequestEvent; fetch: ReturnType<typeof vi.fn> } {
  const fetch = vi.fn(async () => response);
  const event = {
    url: new URL('http://admin.test/productos'),
    request: new Request('http://admin.test/productos', { headers: { cookie: 'session=abc' } }),
    cookies: { getAll: () => [{ name: 'session', value: 'abc' }] },
    fetch,
  } as unknown as RequestEvent;
  return { event, fetch };
}

describe('cliente server-side del menú', () => {
  it('reenvía la sesión, CSRF y query al listado de categorías', async () => {
    const { event, fetch } = eventFor(
      new Response(
        JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );

    await createMenuClient(event, 'http://api.test/').listCategories({
      locationId: 'location-1',
      page: 2,
      search: 'café',
      includeInactive: true,
    });

    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/menu/admin/categories?');
    expect(url).toContain('locationId=location-1');
    expect(url).toContain('search=caf%C3%A9');
    expect((init.headers as Headers).get('cookie')).toBe('session=abc');
    expect((init.headers as Headers).get('origin')).toBe('http://admin.test');
  });

  it('envía JSON al crear una categoría', async () => {
    const { event, fetch } = eventFor(new Response('{}', { status: 201 }));
    await createMenuClient(event, 'http://api.test').createCategory({
      locationId: 'location-1',
      slug: 'coffee',
    });
    const [, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ locationId: 'location-1', slug: 'coffee' }));
  });

  it('convierte respuestas no exitosas en un error del cliente', async () => {
    const { event } = eventFor(
      new Response(JSON.stringify({ message: 'Sin permisos.' }), { status: 403 }),
    );
    await expect(createMenuClient(event, 'http://api.test').listAllergens()).rejects.toBeInstanceOf(
      MenuApiError,
    );
  });
});
