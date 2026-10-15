import { describe, expect, it, vi } from 'vitest';

import { createAnalyticsClient } from './analytics';

describe('createAnalyticsClient', () => {
  it('envía rango y sede en cada consulta protegida', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ totalVisits: 3, daily: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const event = {
      fetch: fetcher,
      request: { headers: new Headers() },
      cookies: { getAll: () => [] },
      url: new URL('https://admin.example/estadisticas'),
    } as never;

    await createAnalyticsClient(event, 'https://api.example').getSummary(
      'location-1',
      '2026-10-01',
      '2026-10-15',
    );

    expect(String(fetcher.mock.calls[0][0])).toBe(
      'https://api.example/analytics/admin/summary?locationId=location-1&from=2026-10-01&to=2026-10-15',
    );
  });
});
