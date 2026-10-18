import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type {
  PreviewTokenResponse,
  PublicationAction,
  PublicationContext,
  PublicationResourceType,
  PublicationStatus,
} from '$lib/publication/types';

/** Estado de publicación devuelto tras programar o publicar un recurso. */
export interface PublicationResponse {
  resourceType: PublicationResourceType;
  resourceId: string;
  locationId: string;
  timezone: string;
  publicationStatus: PublicationStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  expiresAt: string | null;
}

/** Error al cambiar visibilidad o vista previa de contenido publicable. */
export class PublicationApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PublicationApiError';
  }
}

/** Añade `locationId` como único parámetro de consulta. */
function withLocation(path: string, locationId: string): string {
  return `${path}?${new URLSearchParams({ locationId }).toString()}`;
}

/** Cliente BFF de publicación; coordina estados sin exponer tokens al cliente. */
export function createPublicationClient(event: RequestEvent, apiBaseUrl: string) {
  /** Solicitudes autenticadas bajo `/publication/admin`. */
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok)
      throw new PublicationApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Metadatos de zona horaria y reglas de publicación de la sede. */
    context(locationId: string) {
      return request<PublicationContext>(withLocation('/publication/admin/context', locationId));
    },
    /** Aplica una acción de publicación (publicar, programar, retirar) sobre un recurso. */
    update(
      resourceType: PublicationResourceType,
      resourceId: string,
      locationId: string,
      payload: {
        action: PublicationAction;
        publishedAt?: string;
        scheduledAt?: string;
        expiresAt?: string;
      },
    ) {
      return request<PublicationResponse>(
        withLocation(
          `/publication/admin/${resourceType}/${encodeURIComponent(resourceId)}`,
          locationId,
        ),
        { method: 'POST', json: payload },
      );
    },
    /** Genera token de vista previa temporal para un recurso. */
    preview(resourceType: PublicationResourceType, resourceId: string, locationId: string) {
      return request<PreviewTokenResponse>(
        withLocation(
          `/publication/admin/${resourceType}/${encodeURIComponent(resourceId)}/preview`,
          locationId,
        ),
        { method: 'POST' },
      );
    },
  };
}
