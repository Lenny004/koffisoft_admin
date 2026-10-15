import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type { ImportantAnnouncement } from '$lib/announcements/types';

export class AnnouncementsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AnnouncementsApiError';
  }
}

function withQuery(path: string, values: Record<string, string | boolean | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/** Cliente BFF del CRUD de avisos; la sesión permanece en cookies HttpOnly. */
export function createAnnouncementsClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok)
      throw new AnnouncementsApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    list(locationId: string) {
      return request<ImportantAnnouncement[]>(
        withQuery('/announcements/admin', { locationId, includeInactive: true }),
      );
    },
    create(payload: unknown) {
      return request<ImportantAnnouncement>('/announcements/admin', {
        method: 'POST',
        json: payload,
      });
    },
    update(id: string, locationId: string, payload: unknown) {
      return request<ImportantAnnouncement>(
        withQuery(`/announcements/admin/${encodeURIComponent(id)}`, { locationId }),
        {
          method: 'PATCH',
          json: payload,
        },
      );
    },
    remove(id: string, locationId: string) {
      return request<ImportantAnnouncement>(
        withQuery(`/announcements/admin/${encodeURIComponent(id)}`, { locationId }),
        { method: 'DELETE' },
      );
    },
  };
}
