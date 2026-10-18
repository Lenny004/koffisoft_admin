import type { RequestEvent } from '@sveltejs/kit';

import type { NotificationPage, UnreadCount } from '$lib/notifications/types';
import { apiErrorMessage, apiRequest, readJson } from './api';
import { withQuery, type QueryValue } from './query';

/** Error al sincronizar la bandeja de notificaciones con la API. */
export class NotificationsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'NotificationsApiError';
  }
}

/** Cliente BFF de notificaciones; mantiene la sesión en el servidor. */
export function createNotificationsClient(event: RequestEvent, apiBaseUrl: string) {
  /** Proxy autenticado hacia rutas `/notifications`. */
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) {
      throw new NotificationsApiError(response.status, await apiErrorMessage(response));
    }
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Página de notificaciones según filtros de consulta. */
    list(query: Record<string, QueryValue>) {
      return request<NotificationPage>(withQuery('/notifications', query));
    },
    /** Contador de notificaciones sin leer para badges del panel. */
    unreadCount() {
      return request<UnreadCount>('/notifications/unread-count');
    },
    /** Marca una notificación o todas como leídas. */
    markRead(notificationId?: string) {
      return request<void>('/notifications/mark-read', {
        method: 'POST',
        json: notificationId ? { notificationId } : {},
      });
    },
    /** Archiva una notificación concreta. */
    archive(notificationId: string) {
      return request<void>('/notifications/archive', {
        method: 'POST',
        json: { notificationId },
      });
    },
  };
}
