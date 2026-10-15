import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { localElSalvadorDateTimeToIso } from '$lib/formatting/dates';
import type { ImportantAnnouncement } from '$lib/announcements/types';
import type { Event } from '$lib/events/types';
import type { MenuItem } from '$lib/menu/types';
import type { PublicationEntry, PublicationResourceType } from '$lib/publication/types';
import { createAnnouncementsClient, AnnouncementsApiError } from '$lib/server/announcements';
import { createEventsClient, EventsApiError } from '$lib/server/events';
import { createMenuClient, MenuApiError } from '$lib/server/menu';
import { createPublicationClient, PublicationApiError } from '$lib/server/publication';
import { formText } from '$lib/validation/menu';
import { formValues, validationErrors } from '$lib/validation/errors';
import { publicationSchema } from '$lib/validation/publication';

function configurationError(): string {
  return 'Configura API_BASE_URL y DEFAULT_LOCATION_ID para gestionar publicaciones.';
}

function apiMessage(error: unknown): string {
  if (
    error instanceof PublicationApiError ||
    error instanceof AnnouncementsApiError ||
    error instanceof EventsApiError ||
    error instanceof MenuApiError
  )
    return error.message;
  return 'No se pudo conectar con la API editorial.';
}

function entryFromAnnouncement(item: ImportantAnnouncement): PublicationEntry {
  return {
    resourceType: 'announcement',
    resourceId: item.id,
    title: item.title,
    kindLabel: 'Aviso',
    publicationStatus: item.publicationStatus ?? 'Draft',
    publishedAt: item.publishedAt ?? null,
    scheduledAt: item.scheduledAt ?? null,
    expiresAt: item.expiresAt ?? null,
    active: item.active,
  };
}

function entryFromMenuItem(item: MenuItem): PublicationEntry {
  return {
    resourceType: 'menu_item',
    resourceId: item.id,
    title: item.nameEs,
    kindLabel: 'Plato',
    publicationStatus: item.publicationStatus ?? 'Draft',
    publishedAt: item.publishedAt ?? null,
    scheduledAt: item.scheduledAt ?? null,
    expiresAt: item.expiresAt ?? null,
    active: item.active && item.publicVisible,
  };
}

function entryFromEvent(item: Event): PublicationEntry {
  return {
    resourceType: 'event',
    resourceId: item.id,
    title: item.title,
    kindLabel: 'Evento',
    publicationStatus: item.publicationStatus ?? 'Draft',
    publishedAt: item.publishedAt ?? null,
    scheduledAt: item.scheduledAt ?? null,
    expiresAt: item.expiresAt ?? null,
    active: item.status !== 'Cancelled',
  };
}

export const load: PageServerLoad = async (event) => {
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;
  const canPublish = permissions.includes('content.publish');
  if (!env.API_BASE_URL || !locationId) {
    return {
      locationId,
      permissions,
      timezone: 'America/El_Salvador',
      entries: [],
      error: configurationError(),
    };
  }
  if (!canPublish) {
    return {
      locationId,
      permissions,
      timezone: 'America/El_Salvador',
      entries: [],
      error: 'No tienes permiso para publicar contenido.',
    };
  }

  const publicationClient = createPublicationClient(event, env.API_BASE_URL);
  const [contextResult, announcementsResult, menuResult, eventsResult] = await Promise.allSettled([
    publicationClient.context(locationId),
    createAnnouncementsClient(event, env.API_BASE_URL).list(locationId),
    createMenuClient(event, env.API_BASE_URL).listItems({
      locationId,
      page: 1,
      pageSize: 100,
      includeInactive: true,
    }),
    createEventsClient(event, env.API_BASE_URL).listEvents({
      locationId,
      page: 1,
      pageSize: 100,
    }),
  ]);

  const entries: PublicationEntry[] = [];
  if (announcementsResult.status === 'fulfilled')
    entries.push(...announcementsResult.value.map(entryFromAnnouncement));
  if (menuResult.status === 'fulfilled')
    entries.push(...menuResult.value.data.map(entryFromMenuItem));
  if (eventsResult.status === 'fulfilled')
    entries.push(...eventsResult.value.data.map(entryFromEvent));
  const failed = [contextResult, announcementsResult, menuResult, eventsResult].find(
    (result) => result.status === 'rejected',
  );
  return {
    locationId,
    permissions,
    timezone:
      contextResult.status === 'fulfilled' ? contextResult.value.timezone : 'America/El_Salvador',
    entries,
    error: failed?.status === 'rejected' ? apiMessage(failed.reason) : undefined,
  };
};

function parseResourceType(value: string): PublicationResourceType | null {
  return value === 'announcement' || value === 'event' || value === 'menu_item' ? value : null;
}

export const actions: Actions = {
  save: async (event) => {
    if (!event.locals.permissions.includes('content.publish'))
      return fail(403, { action: 'save', errors: ['No tienes permiso para publicar contenido.'] });

    const formData = await event.request.formData();
    const resourceType = formText(formData.get('resourceType'));
    const values = {
      resourceType,
      resourceId: formText(formData.get('resourceId')),
      action: formText(formData.get('action')),
      scheduledAt: formText(formData.get('scheduledAt')),
      expiresAt: formText(formData.get('expiresAt')),
    };
    const result = publicationSchema.safeParse(values);
    if (!result.success)
      return fail(400, {
        action: 'save',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });

    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!env.API_BASE_URL || !locationId)
      return fail(503, { action: 'save', errors: [configurationError()] });

    try {
      await createPublicationClient(event, env.API_BASE_URL).update(
        result.data.resourceType,
        result.data.resourceId,
        locationId,
        {
          action: result.data.action,
          ...(result.data.scheduledAt
            ? { scheduledAt: localElSalvadorDateTimeToIso(result.data.scheduledAt) }
            : {}),
          ...(result.data.expiresAt
            ? { expiresAt: localElSalvadorDateTimeToIso(result.data.expiresAt) }
            : {}),
        },
      );
      return { success: true };
    } catch (error) {
      return fail(error instanceof PublicationApiError ? error.status : 502, {
        action: 'save',
        errors: [apiMessage(error)],
      });
    }
  },
  preview: async (event) => {
    if (!event.locals.permissions.includes('content.publish'))
      return fail(403, {
        action: 'preview',
        errors: ['No tienes permiso para previsualizar contenido.'],
      });
    const formData = await event.request.formData();
    const resourceType = parseResourceType(formText(formData.get('resourceType')));
    const resourceId = formText(formData.get('resourceId'));
    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!resourceType || !resourceId || !locationId || !env.API_BASE_URL)
      return fail(400, { action: 'preview', errors: ['El contenido seleccionado no es válido.'] });
    try {
      const result = await createPublicationClient(event, env.API_BASE_URL).preview(
        resourceType,
        resourceId,
        locationId,
      );
      return { previewPath: result.previewPath, previewExpiresAt: result.expiresAt };
    } catch (error) {
      return fail(error instanceof PublicationApiError ? error.status : 502, {
        action: 'preview',
        errors: [apiMessage(error)],
      });
    }
  },
};
