import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type {
  PreviewTokenResponse,
  PublicationAction,
  PublicationContext,
  PublicationResourceType,
  PublicationStatus,
} from '$lib/publication/types';

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

export class PublicationApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PublicationApiError';
  }
}

function withLocation(path: string, locationId: string): string {
  return `${path}?${new URLSearchParams({ locationId }).toString()}`;
}

export function createPublicationClient(event: RequestEvent, apiBaseUrl: string) {
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
    context(locationId: string) {
      return request<PublicationContext>(withLocation('/publication/admin/context', locationId));
    },
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
