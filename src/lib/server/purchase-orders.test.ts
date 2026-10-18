import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import { createPurchaseOrdersClient } from './purchase-orders';

const adminOrigin = env.ORIGIN || 'http://admin.test';

function eventFor(response: Response): { event: RequestEvent; fetch: ReturnType<typeof vi.fn> } {
  const fetch = vi.fn(async () => response);
  const event = {
    url: new URL(`${adminOrigin}/ordenes-compra`),
    request: new Request(`${adminOrigin}/ordenes-compra`, {
      headers: { cookie: 'session=abc' },
    }),
    cookies: { getAll: () => [{ name: 'session', value: 'abc' }] },
    fetch,
  } as unknown as RequestEvent;
  return { event, fetch };
}

describe('cliente server-side de órdenes de compra', () => {
  it('consulta el listado con sede, estado y proveedor', async () => {
    const { event, fetch } = eventFor(
      new Response(JSON.stringify({ data: [], total: 0, page: 1, perPage: 20 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await createPurchaseOrdersClient(event, 'http://api.test').listOrders({
      locationId: 'location-1',
      status: 'Draft',
      supplierId: 'supplier-1',
      page: 2,
      perPage: 20,
    });

    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/purchase-orders?');
    expect(url).toContain('locationId=location-1');
    expect(url).toContain('status=Draft');
    expect(url).toContain('supplierId=supplier-1');
    expect(url).toContain('page=2');
  });

  it('reemplaza las líneas de un borrador', async () => {
    const { event, fetch } = eventFor(new Response('{}', { status: 200 }));
    const payload = {
      lines: [
        {
          id: 'line-1',
          ingredientId: 'ingredient-1',
          unitId: 'unit-1',
          quantityOrdered: 4,
          unitCost: 2.5,
        },
      ],
    };
    await createPurchaseOrdersClient(event, 'http://api.test').replaceDraftLines(
      'order-1',
      payload,
    );
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/purchase-orders/order-1/lines');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify(payload));
  });

  it('envía la recepción con lote y ubicación', async () => {
    const { event, fetch } = eventFor(new Response('{}', { status: 200 }));
    const payload = {
      storageLocationId: 'storage-1',
      lines: [{ lineId: 'line-1', quantityReceived: 2, lotCode: 'L-01' }],
    };
    await createPurchaseOrdersClient(event, 'http://api.test').receiveOrder('order-1', payload);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/purchase-orders/order-1/receive');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify(payload));
  });

  it('consulta el historial de compras del proveedor', async () => {
    const { event, fetch } = eventFor(
      new Response(JSON.stringify({ orders: [], totalOrders: 0, totalAmount: '0' }), {
        status: 200,
      }),
    );
    await createPurchaseOrdersClient(event, 'http://api.test').getSupplierHistory('supplier-1');
    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/suppliers/supplier-1/orders');
  });
});
