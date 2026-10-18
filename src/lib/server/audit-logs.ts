import type { RequestEvent } from '@sveltejs/kit';

import type { AuditLogPage } from '$lib/audit/types';
import { apiErrorMessage, apiRequest, readJson } from './api';
import { withQuery, type QueryValue } from './query';

export class AuditLogsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AuditLogsApiError';
  }
}

export function createAuditLogsClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new AuditLogsApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    list(query: Record<string, QueryValue>) {
      return request<AuditLogPage>(withQuery('/audit-logs', query));
    },
  };
}
