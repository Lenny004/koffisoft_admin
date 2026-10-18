import type { RequestEvent } from '@sveltejs/kit';

import type { BackupJob, BackupType } from '$lib/backups/types';
import { apiErrorMessage, apiRequest, readJson } from './api';

/** Error al gestionar trabajos de respaldo en la API. */
export class BackupApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'BackupApiError';
  }
}

/** Serializa parámetros de consulta omitiendo valores vacíos. */
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
  /** Ejecuta mutaciones y lecturas de respaldo con manejo uniforme de errores. */
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new BackupApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Historial reciente de trabajos de respaldo. */
    list(limit = 100) {
      return request<BackupJob[]>(withQuery('/backups/admin', { limit }));
    },
    /** Encola un nuevo respaldo del tipo indicado. */
    create(type: BackupType) {
      return request<BackupJob>('/backups/admin', { method: 'POST', json: { type } });
    },
    /** Elimina un trabajo de respaldo por identificador. */
    delete(id: string) {
      return request<BackupJob>(`/backups/admin/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
  };
}
