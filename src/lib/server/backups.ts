import type { RequestEvent } from '@sveltejs/kit';

import type { BackupJob, BackupType } from '$lib/backups/types';
import { apiErrorMessage, apiRequest, readJson } from './api';

export class BackupApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'BackupApiError';
  }
}

function withQuery(path: string, values: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/** Cliente BFF de respaldos: conserva la sesión HttpOnly y nunca entrega rutas del VPS al navegador. */
export function createBackupClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new BackupApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    list(limit = 100) {
      return request<BackupJob[]>(withQuery('/backups/admin', { limit }));
    },
    create(type: BackupType) {
      return request<BackupJob>('/backups/admin', { method: 'POST', json: { type } });
    },
    delete(id: string) {
      return request<BackupJob>(`/backups/admin/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
  };
}
