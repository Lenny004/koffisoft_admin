import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

import { createEventsClient } from './events';

function eventFor(response: Response): { event: RequestEvent; fetch: ReturnType<typeof vi.fn> } {
  const fetch = vi.fn(async () => response);
  const event = {
    url: new URL('http://admin.test/eventos'),
    request: new Request('http://admin.test/eventos', { headers: { cookie: 'session=abc' } }),
    cookies: { getAll: () => [{ name: 'session', value: 'abc' }] },
    fetch,
  } as unknown as RequestEvent;
  return { event, fetch };
}

describe('cliente server-side de eventos', () => {
  it('lista paquetes con includeInactive y ubicación', async () => {
    const { event, fetch } = eventFor(new Response('[]', { status: 200 }));
    await createEventsClient(event, 'http://api.test').listPackages({
      locationId: 'location-1',
      includeInactive: true,
    });
    const [url] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/events/admin/packages?');
    expect(url).toContain('locationId=location-1');
    expect(url).toContain('includeInactive=true');
  });

  it('crea cotizaciones por el endpoint anidado del evento', async () => {
    const { event, fetch } = eventFor(new Response('{}', { status: 201 }));
    await createEventsClient(event, 'http://api.test').createQuote('event-1', {
      validUntil: '2026-10-31',
      lines: [],
    });
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/events/admin/event-1/quotes');
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ validUntil: '2026-10-31', lines: [] }));
  });
});
