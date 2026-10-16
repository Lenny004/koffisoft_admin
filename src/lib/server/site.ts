import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type { SiteContent } from '$lib/site/types';

export class SiteApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'SiteApiError';
  }
}

export function createSiteClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(path: string, options: { method?: string; json?: unknown } = {}) {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new SiteApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    get(locationId: string) {
      return request<SiteContent>(`/site/admin?${new URLSearchParams({ locationId }).toString()}`);
    },
    update(locationId: string, payload: unknown) {
      return request<SiteContent>(`/site/admin?${new URLSearchParams({ locationId }).toString()}`, {
        method: 'PATCH',
        json: payload,
      });
    },
  };
}
