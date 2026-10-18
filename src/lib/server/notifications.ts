import type { RequestEvent } from '@sveltejs/kit';

import type { NotificationPage, UnreadCount } from '$lib/notifications/types';
import { apiErrorMessage, apiRequest, readJson } from './api';
import { withQuery, type QueryValue } from './query';

export class NotificationsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'NotificationsApiError';
  }
}

export function createNotificationsClient(event: RequestEvent, apiBaseUrl: string) {
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
    list(query: Record<string, QueryValue>) {
      return request<NotificationPage>(withQuery('/notifications', query));
    },
    unreadCount() {
      return request<UnreadCount>('/notifications/unread-count');
    },
    markRead(notificationId?: string) {
      return request<void>('/notifications/mark-read', {
        method: 'POST',
        json: notificationId ? { notificationId } : {},
      });
    },
    archive(notificationId: string) {
      return request<void>('/notifications/archive', {
        method: 'POST',
        json: { notificationId },
      });
    },
  };
}
