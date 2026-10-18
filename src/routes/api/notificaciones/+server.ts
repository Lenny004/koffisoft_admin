import { env } from '$env/dynamic/private';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { createNotificationsClient, NotificationsApiError } from '$lib/server/notifications';
import { archiveNotificationSchema, markNotificationSchema } from '$lib/validation/notifications';

/** Acciones JSON de la campana: evitan navegar fuera de la pantalla actual. */
export const POST: RequestHandler = async (event) => {
  if (!env.API_BASE_URL) error(503, 'La API no está configurada.');
  const payload = (await event.request.json()) as {
    action?: string;
    notificationId?: string;
  };
  const client = createNotificationsClient(event, env.API_BASE_URL);

  try {
    if (payload.action === 'archive') {
      const result = archiveNotificationSchema.safeParse({
        notificationId: payload.notificationId,
      });
      if (!result.success) error(400, 'La notificación no es válida.');
      await client.archive(result.data.notificationId);
      return json({ ok: true });
    }

    const result = markNotificationSchema.safeParse({
      notificationId: payload.notificationId ?? '',
    });
    if (!result.success) error(400, 'La notificación no es válida.');
    await client.markRead(result.data.notificationId || undefined);
    return json({ ok: true });
  } catch (caught) {
    if (caught instanceof NotificationsApiError) error(caught.status, caught.message);
    throw caught;
  }
};
