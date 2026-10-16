import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import { createInventoryClient, InventoryApiError } from './inventory';

const adminOrigin = env.ORIGIN || 'http://admin.test';

function eventFor(response: Response): { event: RequestEvent; fetch: ReturnType<typeof vi.fn> } {
  const fetch = vi.fn(async () => response);
  const event = {
    url: new URL(`${adminOrigin}/inventario`),
    request: new Request(`${adminOrigin}/inventario`, { headers: { cookie: 'session=abc' } }),
    cookies: { getAll: () => [{ name: 'session', value: 'abc' }] },
    fetch,
  } as unknown as RequestEvent;
  return { event, fetch };
}

describe('cliente server-side de inventario', () => {
  it('consulta existencias con paginación, búsqueda y bodega', async () => {
    const { event, fetch } = eventFor(
      new Response(
        JSON.stringify({ data: [], meta: { page: 2, pageSize: 20, total: 0, totalPages: 1 } }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );

    await createInventoryClient(event, 'http://api.test/').listItems({
      locationId: 'location-1',
      page: 2,
      pageSize: 20,
      search: 'café',
      storageLocationId: 'storage-1',
    });

    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/inventory/admin/items?');
    expect(url).toContain('search=caf%C3%A9');
    expect(url).toContain('storageLocationId=storage-1');
    expect((init.headers as Headers).get('cookie')).toBe('session=abc');
    expect((init.headers as Headers).get('origin')).toBe(adminOrigin);
  });

  it('envía JSON para registrar un ajuste', async () => {
    const { event, fetch } = eventFor(new Response('{}', { status: 201 }));
    const payload = {
      locationId: 'location-1',
      movementType: 'waste',
      quantity: '2',
      reason: 'Daño',
    };
    await createInventoryClient(event, 'http://api.test').createAdjustment(payload);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/inventory/admin/movements/adjustments');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify(payload));
  });

  it('mantiene la sede en los detalles y mutaciones por ID', async () => {
    const { event, fetch } = eventFor(new Response('{}', { status: 200 }));
    const client = createInventoryClient(event, 'http://api.test');

    await client.getSupplier('supplier-1', 'location-1');
    await client.updateSupplier('supplier-1', 'location-1', { active: false });
    await client.deleteSupplier('supplier-1', 'location-1');
    await client.getReceipt('receipt-1', 'location-1');

    for (const [url] of fetch.mock.calls as Array<[string, RequestInit]>) {
      expect(url).toContain('locationId=location-1');
    }
  });

  it('expone el estado HTTP como error del cliente', async () => {
    const { event } = eventFor(
      new Response(JSON.stringify({ message: 'Sin permiso.' }), { status: 403 }),
    );
    await expect(
      createInventoryClient(event, 'http://api.test').listAlerts('location-1', 30),
    ).rejects.toBeInstanceOf(InventoryApiError);
  });
});
