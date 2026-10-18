import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type { ImportantAnnouncement } from '$lib/announcements/types';

/** Error lanzado cuando el CRUD de avisos recibe una respuesta HTTP no exitosa. */
export class AnnouncementsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AnnouncementsApiError';
  }
}

/** Añade parámetros opcionales omitiendo valores vacíos o indefinidos. */
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
  /** Propaga cookies de sesión y normaliza errores de la API de avisos. */
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
    /** Lista avisos de una sede, incluidos inactivos. */
    list(locationId: string) {
      return request<ImportantAnnouncement[]>(
        withQuery('/announcements/admin', { locationId, includeInactive: true }),
      );
    },
    /** Crea un aviso importante en la sede indicada en el payload. */
    create(payload: unknown) {
      return request<ImportantAnnouncement>('/announcements/admin', {
        method: 'POST',
        json: payload,
      });
    },
    /** Actualiza campos de un aviso existente. */
    update(id: string, locationId: string, payload: unknown) {
      return request<ImportantAnnouncement>(
        withQuery(`/announcements/admin/${encodeURIComponent(id)}`, { locationId }),
        {
          method: 'PATCH',
          json: payload,
        },
      );
    },
    /** Elimina (o desactiva según API) un aviso por identificador. */
    remove(id: string, locationId: string) {
      return request<ImportantAnnouncement>(
        withQuery(`/announcements/admin/${encodeURIComponent(id)}`, { locationId }),
        { method: 'DELETE' },
      );
    },
  };
}
