import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type {
  Event,
  EventPackage,
  EventPage,
  EventQuote,
  EventQuotePage,
  EventRequirement,
  EventSpaceBooking,
} from '$lib/events/types';

export class EventsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'EventsApiError';
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

export function createEventsClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new EventsApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    listEvents(query: { locationId: string; page?: number; pageSize?: number; status?: string }) {
      return request<EventPage>(withQuery('/events/admin', query));
    },
    getEvent(id: string) {
      return request<Event>(`/events/admin/${encodeURIComponent(id)}`);
    },
    createEvent(payload: unknown) {
      return request<Event>('/events/admin', { method: 'POST', json: payload });
    },
    updateEvent(id: string, payload: unknown) {
      return request<Event>(`/events/admin/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    deleteEvent(id: string) {
      return request<Event>(`/events/admin/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
    createSpaceBooking(eventId: string, payload: unknown) {
      return request<EventSpaceBooking>(`/events/admin/${encodeURIComponent(eventId)}/spaces`, {
        method: 'POST',
        json: payload,
      });
    },
    releaseSpaceBooking(id: string) {
      return request<EventSpaceBooking>(`/events/admin/bookings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    listPackages(query: { locationId: string; includeInactive?: boolean }) {
      return request<EventPackage[]>(withQuery('/events/admin/packages', query));
    },
    getPackage(id: string) {
      return request<EventPackage>(`/events/admin/packages/${encodeURIComponent(id)}`);
    },
    createPackage(payload: unknown) {
      return request<EventPackage>('/events/admin/packages', { method: 'POST', json: payload });
    },
    updatePackage(id: string, payload: unknown) {
      return request<EventPackage>(`/events/admin/packages/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    deletePackage(id: string) {
      return request<EventPackage>(`/events/admin/packages/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    listQuotes(eventId: string) {
      return request<EventQuotePage>(`/events/admin/${encodeURIComponent(eventId)}/quotes`);
    },
    getQuote(id: string) {
      return request<EventQuote>(`/events/admin/quotes/${encodeURIComponent(id)}`);
    },
    createQuote(eventId: string, payload: unknown) {
      return request<EventQuote>(`/events/admin/${encodeURIComponent(eventId)}/quotes`, {
        method: 'POST',
        json: payload,
      });
    },
    updateQuoteStatus(id: string, status: string) {
      return request<EventQuote>(`/events/admin/quotes/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        json: { status },
      });
    },
    createRequirement(eventId: string, payload: unknown) {
      return request<EventRequirement>(
        `/events/admin/${encodeURIComponent(eventId)}/requirements`,
        {
          method: 'POST',
          json: payload,
        },
      );
    },
    updateRequirement(id: string, payload: unknown) {
      return request<EventRequirement>(`/events/admin/requirements/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    deleteRequirement(id: string) {
      return request<void>(`/events/admin/requirements/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };
}
