import type { RequestEvent } from '@sveltejs/kit';

import type { MaintenanceSchedule, ResourceItem, ResourcePage } from '$lib/resources/types';
import { apiErrorMessage, apiRequest, readJson } from './api';
import { withQuery, type QueryValue } from './query';

export class ResourcesApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ResourcesApiError';
  }
}

export function createResourcesClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new ResourcesApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    list(query: Record<string, QueryValue>) {
      return request<ResourcePage>(withQuery('/resources/admin', query));
    },
    get(id: string, locationId: string) {
      return request<ResourceItem>(
        withQuery(`/resources/admin/${encodeURIComponent(id)}`, { locationId }),
      );
    },
    create(payload: unknown) {
      return request<ResourceItem>('/resources/admin', { method: 'POST', json: payload });
    },
    update(id: string, locationId: string, payload: unknown) {
      return request<ResourceItem>(
        withQuery(`/resources/admin/${encodeURIComponent(id)}`, { locationId }),
        { method: 'PATCH', json: payload },
      );
    },
    scheduleMaintenance(payload: unknown) {
      return request<MaintenanceSchedule>('/resources/admin/maintenance', {
        method: 'POST',
        json: payload,
      });
    },
    completeMaintenance(id: string, payload: unknown) {
      return request<MaintenanceSchedule>(
        `/resources/admin/maintenance/${encodeURIComponent(id)}/complete`,
        { method: 'PATCH', json: payload },
      );
    },
  };
}
