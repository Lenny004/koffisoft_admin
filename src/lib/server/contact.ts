import type { RequestEvent } from '@sveltejs/kit';

import type {
  ContactConversion,
  ContactMessage,
  ContactPage,
  ContactStatus,
} from '$lib/contact/types';
import { apiErrorMessage, apiRequest, readJson } from './api';

export class ContactApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ContactApiError';
  }
}

function withQuery(
  path: string,
  values: Record<string, string | number | boolean | undefined>,
): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/** Cliente BFF de la bandeja; las cookies de sesión permanecen en el servidor. */
export function createContactClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new ContactApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    list(query: {
      locationId: string;
      page?: number;
      pageSize?: number;
      status?: ContactStatus;
      search?: string;
      includeArchived?: boolean;
    }) {
      return request<ContactPage>(withQuery('/contact/admin', query));
    },
    get(id: string, locationId: string) {
      return request<ContactMessage>(
        withQuery(`/contact/admin/${encodeURIComponent(id)}`, { locationId }),
      );
    },
    update(id: string, locationId: string, payload: unknown) {
      return request<ContactMessage>(
        withQuery(`/contact/admin/${encodeURIComponent(id)}`, { locationId }),
        { method: 'PATCH', json: payload },
      );
    },
    convertCustomer(id: string, locationId: string) {
      return request<ContactConversion>(
        withQuery(`/contact/admin/${encodeURIComponent(id)}/customer`, { locationId }),
        { method: 'POST', json: {} },
      );
    },
    convertReservation(id: string, locationId: string, payload: unknown) {
      return request<ContactConversion>(
        withQuery(`/contact/admin/${encodeURIComponent(id)}/reservation`, { locationId }),
        { method: 'POST', json: payload },
      );
    },
    convertEvent(id: string, locationId: string, payload: unknown) {
      return request<ContactConversion>(
        withQuery(`/contact/admin/${encodeURIComponent(id)}/event`, { locationId }),
        { method: 'POST', json: payload },
      );
    },
  };
}
