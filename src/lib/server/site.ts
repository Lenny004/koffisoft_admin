import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type { SiteContent } from '$lib/site/types';

/** Error al leer o guardar contenido del sitio público por sede. */
export class SiteApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'SiteApiError';
  }
}

/** Cliente BFF del editor de contenido del sitio; acota cambios por `locationId`. */
export function createSiteClient(event: RequestEvent, apiBaseUrl: string) {
  /** Solicitudes autenticadas a `/site/admin`. */
  async function request<T>(path: string, options: { method?: string; json?: unknown } = {}) {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new SiteApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Obtiene el contenido publicable configurado para la sede. */
    get(locationId: string) {
      return request<SiteContent>(`/site/admin?${new URLSearchParams({ locationId }).toString()}`);
    },
    /** Persiste cambios parciales del contenido del sitio. */
    update(locationId: string, payload: unknown) {
      return request<SiteContent>(`/site/admin?${new URLSearchParams({ locationId }).toString()}`, {
        method: 'PATCH',
        json: payload,
      });
    },
  };
}
