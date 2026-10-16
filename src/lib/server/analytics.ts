import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type {
  AnalyticsLocation,
  AnalyticsPageRow,
  AnalyticsProductRow,
  AnalyticsReferrerRow,
  AnalyticsSummary,
} from '$lib/analytics/types';

export class AnalyticsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AnalyticsApiError';
  }
}

function withRange(path: string, locationId: string, from: string, to: string): string {
  const query = new URLSearchParams({ locationId, from, to });
  return `${path}?${query.toString()}`;
}

/** Cliente BFF de reportes: reusa la sesión HttpOnly y el CSRF del cliente común. */
export function createAnalyticsClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(path: string): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl);
    if (!response.ok) throw new AnalyticsApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    listLocations() {
      return request<AnalyticsLocation[]>('/analytics/admin/locations');
    },
    getSummary(locationId: string, from: string, to: string) {
      return request<AnalyticsSummary>(withRange('/analytics/admin/summary', locationId, from, to));
    },
    getPages(locationId: string, from: string, to: string) {
      return request<AnalyticsPageRow[]>(withRange('/analytics/admin/pages', locationId, from, to));
    },
    getProducts(locationId: string, from: string, to: string) {
      return request<AnalyticsProductRow[]>(
        withRange('/analytics/admin/products', locationId, from, to),
      );
    },
    getReferrers(locationId: string, from: string, to: string) {
      return request<AnalyticsReferrerRow[]>(
        withRange('/analytics/admin/referrers', locationId, from, to),
      );
    },
  };
}
