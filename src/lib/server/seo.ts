import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type { SeoMetadata, SeoResourceType } from '$lib/seo/types';

/** Error al administrar metadatos SEO en la API. */
export class SeoApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'SeoApiError';
  }
}

/** Añade parámetros de consulta omitiendo valores falsy. */
function withQuery(path: string, values: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) query.set(key, value);
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/** Cliente BFF de SEO: conserva la cookie HttpOnly y limita las mutaciones al servidor. */
export function createSeoClient(event: RequestEvent, apiBaseUrl: string) {
  /** Solicitudes autenticadas a `/seo/admin`. */
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new SeoApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Metadatos SEO de la sede, opcionalmente filtrados por tipo de recurso. */
    list(locationId: string, resourceType?: SeoResourceType) {
      return request<SeoMetadata[]>(withQuery('/seo/admin', { locationId, resourceType }));
    },
    /** Crea un registro SEO asociado a un recurso publicable. */
    create(payload: unknown) {
      return request<SeoMetadata>('/seo/admin', { method: 'POST', json: payload });
    },
    /** Actualiza título, descripción u Open Graph de un registro. */
    update(id: string, locationId: string, payload: unknown) {
      return request<SeoMetadata>(
        withQuery(`/seo/admin/${encodeURIComponent(id)}`, { locationId }),
        {
          method: 'PATCH',
          json: payload,
        },
      );
    },
    /** Elimina metadatos SEO de un recurso en la sede. */
    remove(id: string, locationId: string) {
      return request<{ deleted: boolean }>(
        withQuery(`/seo/admin/${encodeURIComponent(id)}`, { locationId }),
        { method: 'DELETE' },
      );
    },
  };
}
