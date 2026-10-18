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

/** Error al gestionar reservas, espacios o mesas en la API. */
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

/** Serializa filtros de listados de reservas omitiendo valores vacíos. */
function withQuery(path: string, values: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/** Cliente BFF de reservas, salones y mesas del comedor. */
export function createReservationsClient(event: RequestEvent, apiBaseUrl: string) {
  /** Proxy autenticado bajo prefijos `/reservations/admin`. */
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
    /** Reservas paginadas por sede, fechas, estado o espacio. */
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
    /** Detalle de una reserva por identificador. */
    getReservation(id: string) {
      return request<Reservation>(`/reservations/admin/${encodeURIComponent(id)}`);
    },
    /** Crea una reserva desde el panel (walk-in o telefónica). */
    createAdminReservation(payload: unknown) {
      return request<Reservation>('/reservations/admin', { method: 'POST', json: payload });
    },
    /** Avanza el flujo de estados (confirmar, sentar, completar, cancelar, no-show). */
    transitionReservation(
      id: string,
      action: 'confirm' | 'seat' | 'complete' | 'cancel' | 'no-show',
    ) {
      return request<Reservation>(`/reservations/admin/${encodeURIComponent(id)}/${action}`, {
        method: 'POST',
      });
    },
    /** Asigna mesas físicas a una reserva confirmada. */
    assignTables(id: string, tableIds: string[]) {
      return request<Reservation>(`/reservations/admin/${encodeURIComponent(id)}/tables`, {
        method: 'PUT',
        json: { tableIds },
      });
    },
    /** Espacios o salones reservables en una sede. */
    listSpaces(query: { locationId: string; includeInactive?: boolean }) {
      return request<VenueSpace[]>(withQuery('/reservations/admin-spaces', query));
    },
    /** Configuración de un espacio concreto. */
    getSpace(id: string) {
      return request<VenueSpace>(`/reservations/admin-spaces/${encodeURIComponent(id)}`);
    },
    /** Alta de un espacio en la sede. */
    createSpace(payload: unknown) {
      return request<VenueSpace>('/reservations/admin-spaces', { method: 'POST', json: payload });
    },
    /** Actualiza capacidad, nombre u otras propiedades del espacio. */
    updateSpace(id: string, payload: unknown) {
      return request<VenueSpace>(`/reservations/admin-spaces/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    /** Desactiva o elimina un espacio según reglas de la API. */
    deleteSpace(id: string) {
      return request<VenueSpace>(`/reservations/admin-spaces/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    /** Mesas disponibles, opcionalmente filtradas por espacio. */
    listTables(query: { spaceId?: string } = {}) {
      return request<DiningTable[]>(withQuery('/reservations/admin-tables', query));
    },
    /** Detalle de una mesa. */
    getTable(id: string) {
      return request<DiningTable>(`/reservations/admin-tables/${encodeURIComponent(id)}`);
    },
    /** Registra una mesa en un espacio. */
    createTable(payload: unknown) {
      return request<DiningTable>('/reservations/admin-tables', { method: 'POST', json: payload });
    },
    /** Modifica código, capacidad o espacio de una mesa. */
    updateTable(id: string, payload: unknown) {
      return request<DiningTable>(`/reservations/admin-tables/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    /** Elimina una mesa del layout. */
    deleteTable(id: string) {
      return request<DiningTable>(`/reservations/admin-tables/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };
}

/** Metadatos de paginación por defecto cuando aún no hay datos cargados. */
export const emptyPageMeta: PageMeta = { page: 1, pageSize: 20, total: 0, totalPages: 1 };
