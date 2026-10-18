import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

import { createNotificationsClient, NotificationsApiError } from '$lib/server/notifications';
import { formText } from '$lib/validation/menu';
import {
  archiveNotificationSchema,
  markNotificationSchema,
  notificationFilterSchema,
} from '$lib/validation/notifications';

const emptyMeta = { page: 1, pageSize: 20, total: 0, totalPages: 1 };

function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof NotificationsApiError) {
    return { status: error.status, errors: [error.message] };
  }
  return { status: 502, errors: ['La API de notificaciones no está disponible en este momento.'] };
}

export const load = async (event: RequestEvent) => {
  const parsed = notificationFilterSchema.safeParse({
    page: event.url.searchParams.get('page') ?? '1',
    notificationType: event.url.searchParams.get('notificationType') ?? '',
    severity: event.url.searchParams.get('severity') ?? '',
    unreadOnly: event.url.searchParams.get('unreadOnly') === '1',
    includeArchived: event.url.searchParams.get('includeArchived') === '1',
  });
  const filters = parsed.success ? parsed.data : notificationFilterSchema.parse({});
  if (!env.API_BASE_URL) {
    return {
      notifications: [],
      meta: { ...emptyMeta, page: filters.page },
      filters,
      error: 'Configura API_BASE_URL para consultar notificaciones.',
    };
  }

  try {
    const response = await createNotificationsClient(event, env.API_BASE_URL).list({
      page: filters.page,
      pageSize: 20,
      notificationType: filters.notificationType || undefined,
      severity: filters.severity || undefined,
      unreadOnly: filters.unreadOnly || undefined,
      includeArchived: filters.includeArchived || undefined,
    });
    return { notifications: response.data, meta: response.meta, filters, error: undefined };
  } catch (error) {
    return {
      notifications: [],
      meta: { ...emptyMeta, page: filters.page },
      filters,
      error:
        error instanceof NotificationsApiError
          ? error.message
          : 'No se pudieron cargar las notificaciones.',
    };
  }
};

export const actions = {
  markRead: async (event: RequestEvent) => {
    const formData = await event.request.formData();
    const result = markNotificationSchema.safeParse({
      notificationId: formText(formData.get('notificationId')),
    });
    if (!result.success) {
      return fail(400, { action: 'markRead', errors: ['La notificación no es válida.'] });
    }
    try {
      await createNotificationsClient(event, env.API_BASE_URL ?? '').markRead(
        result.data.notificationId || undefined,
      );
      return { success: true, action: 'markRead' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'markRead', errors: response.errors });
    }
  },
  markAll: async (event: RequestEvent) => {
    try {
      await createNotificationsClient(event, env.API_BASE_URL ?? '').markRead();
      return { success: true, action: 'markAll' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'markAll', errors: response.errors });
    }
  },
  archive: async (event: RequestEvent) => {
    const formData = await event.request.formData();
    const result = archiveNotificationSchema.safeParse({
      notificationId: formText(formData.get('notificationId')),
    });
    if (!result.success) {
      return fail(400, { action: 'archive', errors: ['La notificación no es válida.'] });
    }
    try {
      await createNotificationsClient(event, env.API_BASE_URL ?? '').archive(
        result.data.notificationId,
      );
      return { success: true, action: 'archive' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'archive', errors: response.errors });
    }
  },
};
