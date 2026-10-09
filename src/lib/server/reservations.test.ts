import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

import { createReservationsClient, ReservationsApiError } from './reservations';

function eventFor(response: Response): { event: RequestEvent; fetch: ReturnType<typeof vi.fn> } {
  const fetch = vi.fn(async () => response);
  const event = {
    url: new URL('http://admin.test/reservaciones'),
    request: new Request('http://admin.test/reservaciones', {
      headers: { cookie: 'session=abc' },
    }),
    cookies: { getAll: () => [{ name: 'session', value: 'abc' }] },
    fetch,
  } as unknown as RequestEvent;
  return { event, fetch };
}

describe('cliente server-side de reservaciones', () => {
  it('construye el listado con filtros y reenvía la sesión', async () => {
    const { event, fetch } = eventFor(
      new Response(
        JSON.stringify({ data: [], meta: { page: 1, pageSize: 20, total: 0, totalPages: 1 } }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );

    await createReservationsClient(event, 'http://api.test/').listReservations({
      locationId: 'location-1',
      page: 2,
      dateFrom: '2026-10-10',
      status: 'Confirmed',
    });

    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/reservations/admin?');
    expect(url).toContain('locationId=location-1');
    expect(url).toContain('dateFrom=2026-10-10');
    expect(url).toContain('status=Confirmed');
    expect((init.headers as Headers).get('cookie')).toBe('session=abc');
    expect((init.headers as Headers).get('origin')).toBe('http://admin.test');
  });

  it('envía la reasignación de mesas con PUT', async () => {
    const { event, fetch } = eventFor(new Response('{}', { status: 200 }));
    await createReservationsClient(event, 'http://api.test').assignTables('reservation-1', [
      'table-1',
    ]);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/reservations/admin/reservation-1/tables');
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify({ tableIds: ['table-1'] }));
  });

  it('crea una reserva interna con POST y cabeceras CSRF del cliente compartido', async () => {
    const { event, fetch } = eventFor(new Response('{}', { status: 201 }));
    await createReservationsClient(event, 'http://api.test').createAdminReservation({
      locationId: 'location-1',
      date: '2026-10-24',
      time: '18:30',
      partySize: 2,
      tableIds: [],
    });
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/reservations/admin');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(
      JSON.stringify({
        locationId: 'location-1',
        date: '2026-10-24',
        time: '18:30',
        partySize: 2,
        tableIds: [],
      }),
    );
    expect((init.headers as Headers).get('origin')).toBe('http://admin.test');
    expect((init.headers as Headers).get('referer')).toBe('http://admin.test/reservaciones');
  });

  it('expone los errores HTTP como ReservationsApiError', async () => {
    const { event } = eventFor(
      new Response(JSON.stringify({ message: 'La mesa se cruza con otra reserva.' }), {
        status: 409,
      }),
    );
    await expect(
      createReservationsClient(event, 'http://api.test').listTables(),
    ).rejects.toMatchObject({
      name: 'ReservationsApiError',
      status: 409,
      message: 'La mesa se cruza con otra reserva.',
    } satisfies Partial<ReservationsApiError>);
  });
});
