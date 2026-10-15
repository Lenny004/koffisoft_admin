import { describe, expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

import { createAnnouncementsClient } from './announcements';

function eventFor(): { event: RequestEvent; fetch: ReturnType<typeof vi.fn> } {
  const fetch = vi.fn(async () => new Response('{}', { status: 200 }));
  const event = {
    url: new URL('http://admin.test/avisos-importantes'),
    request: new Request('http://admin.test/avisos-importantes'),
    cookies: { getAll: () => [] },
    fetch,
  } as unknown as RequestEvent;
  return { event, fetch };
}

describe('cliente server-side de avisos', () => {
  it('envía locationId al actualizar y eliminar por sede', async () => {
    const { event, fetch } = eventFor();
    const client = createAnnouncementsClient(event, 'http://api.test');

    await client.update('announcement-1', 'location-1', { active: false });
    await client.remove('announcement-1', 'location-1');

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://api.test/announcements/admin/announcement-1?locationId=location-1',
      expect.objectContaining({ method: 'PATCH' }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://api.test/announcements/admin/announcement-1?locationId=location-1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
