import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type {
  DiningTable,
  PageMeta,
  Reservation,
  ReservationPage,
  ReservationStatus,
  VenueSpace,
} from '$lib/reservations/types';

export class ReservationsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ReservationsApiError';
  }
}

type QueryValue = string | number | boolean | undefined;

function withQuery(path: string, values: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function createReservationsClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok)
      throw new ReservationsApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    listReservations(query: {
      locationId: string;
      page?: number;
      pageSize?: number;
      dateFrom?: string;
      dateTo?: string;
      status?: ReservationStatus;
      spaceId?: string;
    }) {
      return request<ReservationPage>(withQuery('/reservations/admin', query));
    },
    getReservation(id: string) {
      return request<Reservation>(`/reservations/admin/${encodeURIComponent(id)}`);
    },
    transitionReservation(
      id: string,
      action: 'confirm' | 'seat' | 'complete' | 'cancel' | 'no-show',
    ) {
      return request<Reservation>(`/reservations/admin/${encodeURIComponent(id)}/${action}`, {
        method: 'POST',
      });
    },
    assignTables(id: string, tableIds: string[]) {
      return request<Reservation>(`/reservations/admin/${encodeURIComponent(id)}/tables`, {
        method: 'PUT',
        json: { tableIds },
      });
    },
    listSpaces(query: { locationId: string; includeInactive?: boolean }) {
      return request<VenueSpace[]>(withQuery('/reservations/admin-spaces', query));
    },
    getSpace(id: string) {
      return request<VenueSpace>(`/reservations/admin-spaces/${encodeURIComponent(id)}`);
    },
    createSpace(payload: unknown) {
      return request<VenueSpace>('/reservations/admin-spaces', { method: 'POST', json: payload });
    },
    updateSpace(id: string, payload: unknown) {
      return request<VenueSpace>(`/reservations/admin-spaces/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    deleteSpace(id: string) {
      return request<VenueSpace>(`/reservations/admin-spaces/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    listTables(query: { spaceId?: string } = {}) {
      return request<DiningTable[]>(withQuery('/reservations/admin-tables', query));
    },
    getTable(id: string) {
      return request<DiningTable>(`/reservations/admin-tables/${encodeURIComponent(id)}`);
    },
    createTable(payload: unknown) {
      return request<DiningTable>('/reservations/admin-tables', { method: 'POST', json: payload });
    },
    updateTable(id: string, payload: unknown) {
      return request<DiningTable>(`/reservations/admin-tables/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    deleteTable(id: string) {
      return request<DiningTable>(`/reservations/admin-tables/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };
}

export const emptyPageMeta: PageMeta = { page: 1, pageSize: 20, total: 0, totalPages: 1 };
