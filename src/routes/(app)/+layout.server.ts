import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

import { createNotificationsClient } from '$lib/server/notifications';
import type { NotificationItem } from '$lib/notifications/types';

export const load: LayoutServerLoad = async (event) => {
  const permissions = event.locals.permissions;
  let unreadCount = 0;
  let latestNotifications: NotificationItem[] = [];

  if (env.API_BASE_URL && permissions.includes('notifications.read')) {
    try {
      const client = createNotificationsClient(event, env.API_BASE_URL);
      const [count, page] = await Promise.all([
        client.unreadCount(),
        client.list({ page: 1, pageSize: 8 }),
      ]);
      unreadCount = count.unreadCount;
      latestNotifications = page.data;
    } catch {
      unreadCount = 0;
      latestNotifications = [];
    }
  }

  return {
    user: event.locals.user,
    permissions,
    unreadCount,
    latestNotifications,
  };
};
