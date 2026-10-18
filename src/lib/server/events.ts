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

/** Error al operar eventos, paquetes, cotizaciones o requisitos en la API. */
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

/** Añade filtros de listado omitiendo parámetros vacíos. */
function withQuery(path: string, values: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/** Cliente BFF del módulo de eventos corporativos y celebraciones. */
export function createEventsClient(event: RequestEvent, apiBaseUrl: string) {
  /** Proxy autenticado bajo `/events/admin`. */
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new EventsApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Eventos paginados por sede y estado operativo. */
    listEvents(query: { locationId: string; page?: number; pageSize?: number; status?: string }) {
      return request<EventPage>(withQuery('/events/admin', query));
    },
    /** Detalle de un evento con espacios y requisitos asociados. */
    getEvent(id: string) {
      return request<Event>(`/events/admin/${encodeURIComponent(id)}`);
    },
    /** Registra un nuevo evento en borrador o confirmado. */
    createEvent(payload: unknown) {
      return request<Event>('/events/admin', { method: 'POST', json: payload });
    },
    /** Actualiza fechas, cliente o configuración del evento. */
    updateEvent(id: string, payload: unknown) {
      return request<Event>(`/events/admin/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    /** Cancela o elimina el evento según reglas de negocio. */
    deleteEvent(id: string) {
      return request<Event>(`/events/admin/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
    /** Reserva un espacio físico para el evento. */
    createSpaceBooking(eventId: string, payload: unknown) {
      return request<EventSpaceBooking>(`/events/admin/${encodeURIComponent(eventId)}/spaces`, {
        method: 'POST',
        json: payload,
      });
    },
    /** Libera una reserva de espacio previamente asignada. */
    releaseSpaceBooking(id: string) {
      return request<EventSpaceBooking>(`/events/admin/bookings/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    /** Paquetes comerciales disponibles en la sede. */
    listPackages(query: { locationId: string; includeInactive?: boolean }) {
      return request<EventPackage[]>(withQuery('/events/admin/packages', query));
    },
    /** Detalle de un paquete con ítems incluidos. */
    getPackage(id: string) {
      return request<EventPackage>(`/events/admin/packages/${encodeURIComponent(id)}`);
    },
    /** Crea un paquete reusable para cotizaciones. */
    createPackage(payload: unknown) {
      return request<EventPackage>('/events/admin/packages', { method: 'POST', json: payload });
    },
    /** Modifica precio, nombre o contenido del paquete. */
    updatePackage(id: string, payload: unknown) {
      return request<EventPackage>(`/events/admin/packages/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    /** Retira un paquete del catálogo. */
    deletePackage(id: string) {
      return request<EventPackage>(`/events/admin/packages/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    /** Cotizaciones emitidas para un evento. */
    listQuotes(eventId: string) {
      return request<EventQuotePage>(`/events/admin/${encodeURIComponent(eventId)}/quotes`);
    },
    /** Detalle de una cotización con totales. */
    getQuote(id: string) {
      return request<EventQuote>(`/events/admin/quotes/${encodeURIComponent(id)}`);
    },
    /** Genera una nueva cotización ligada al evento. */
    createQuote(eventId: string, payload: unknown) {
      return request<EventQuote>(`/events/admin/${encodeURIComponent(eventId)}/quotes`, {
        method: 'POST',
        json: payload,
      });
    },
    /** Cambia el estado comercial de la cotización (enviada, aceptada, etc.). */
    updateQuoteStatus(id: string, status: string) {
      return request<EventQuote>(`/events/admin/quotes/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        json: { status },
      });
    },
    /** Añade un requisito logístico o de servicio al evento. */
    createRequirement(eventId: string, payload: unknown) {
      return request<EventRequirement>(
        `/events/admin/${encodeURIComponent(eventId)}/requirements`,
        {
          method: 'POST',
          json: payload,
        },
      );
    },
    /** Actualiza cantidad, notas o responsable de un requisito. */
    updateRequirement(id: string, payload: unknown) {
      return request<EventRequirement>(`/events/admin/requirements/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    /** Elimina un requisito que ya no aplica. */
    deleteRequirement(id: string) {
      return request<void>(`/events/admin/requirements/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };
}
