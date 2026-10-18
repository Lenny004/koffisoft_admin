import type { RequestEvent } from '@sveltejs/kit';

import type {
  ContactConversion,
  ContactMessage,
  ContactPage,
  ContactStatus,
} from '$lib/contact/types';
import { apiErrorMessage, apiRequest, readJson } from './api';

/** Error al operar la bandeja de mensajes de contacto. */
export class ContactApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ContactApiError';
  }
}

/** Construye query string omitiendo parámetros vacíos. */
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
  /** Proxy autenticado hacia `/contact/admin`. */
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new ContactApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Lista mensajes paginados con filtros de estado y búsqueda. */
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
    /** Detalle de un mensaje en una sede. */
    get(id: string, locationId: string) {
      return request<ContactMessage>(
        withQuery(`/contact/admin/${encodeURIComponent(id)}`, { locationId }),
      );
    },
    /** Actualiza estado o metadatos del mensaje. */
    update(id: string, locationId: string, payload: unknown) {
      return request<ContactMessage>(
        withQuery(`/contact/admin/${encodeURIComponent(id)}`, { locationId }),
        { method: 'PATCH', json: payload },
      );
    },
    /** Convierte el lead en registro de cliente. */
    convertCustomer(id: string, locationId: string) {
      return request<ContactConversion>(
        withQuery(`/contact/admin/${encodeURIComponent(id)}/customer`, { locationId }),
        { method: 'POST', json: {} },
      );
    },
    /** Convierte el mensaje en una reserva usando el payload del formulario. */
    convertReservation(id: string, locationId: string, payload: unknown) {
      return request<ContactConversion>(
        withQuery(`/contact/admin/${encodeURIComponent(id)}/reservation`, { locationId }),
        { method: 'POST', json: payload },
      );
    },
    /** Convierte el mensaje en un evento con datos adicionales. */
    convertEvent(id: string, locationId: string, payload: unknown) {
      return request<ContactConversion>(
        withQuery(`/contact/admin/${encodeURIComponent(id)}/event`, { locationId }),
        { method: 'POST', json: payload },
      );
    },
  };
}
