import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { createAnnouncementsClient, AnnouncementsApiError } from '$lib/server/announcements';
import { localElSalvadorDateTimeToIso } from '$lib/formatting/dates';
import { formBoolean, formText } from '$lib/validation/menu';
import { announcementSchema } from '$lib/validation/announcements';
import { formValues, validationErrors } from '$lib/validation/errors';

function configurationError(): string {
  return 'No se pudieron cargar los avisos: configura API_BASE_URL y DEFAULT_LOCATION_ID.';
}

function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof AnnouncementsApiError)
    return { status: error.status, errors: [error.message] };
  return { status: 502, errors: ['La API de avisos no está disponible en este momento.'] };
}

function announcementForm(formData: FormData) {
  const startsAt = formText(formData.get('startsAt'));
  const endsAt = formText(formData.get('endsAt'));
  return {
    id: formText(formData.get('id')),
    title: formText(formData.get('title')),
    message: formText(formData.get('message')),
    ctaLabel: formText(formData.get('ctaLabel')),
    ctaUrl: formText(formData.get('ctaUrl')),
    startsAt: startsAt ? localElSalvadorDateTimeToIso(startsAt) : '',
    endsAt: endsAt ? localElSalvadorDateTimeToIso(endsAt) : '',
    displayOrder: formText(formData.get('displayOrder')) || '0',
    active: formBoolean(formData.get('active'), true),
  };
}

function apiPayload(data: {
  title: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
  startsAt?: string;
  endsAt?: string;
  displayOrder: number;
  active: boolean;
}) {
  return {
    title: data.title,
    message: data.message,
    ctaLabel: data.ctaLabel || null,
    ctaUrl: data.ctaUrl || null,
    startsAt: data.startsAt || null,
    endsAt: data.endsAt || null,
    displayOrder: Number(data.displayOrder),
    active: data.active,
  };
}

export const load: PageServerLoad = async (event) => {
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;
  if (!env.API_BASE_URL || !locationId) {
    return { announcements: [], locationId, permissions, error: configurationError() };
  }

  try {
    const announcements = await createAnnouncementsClient(event, env.API_BASE_URL).list(locationId);
    return { announcements, locationId, permissions, error: undefined };
  } catch (error) {
    return {
      announcements: [],
      locationId,
      permissions,
      error: error instanceof AnnouncementsApiError ? error.message : configurationError(),
    };
  }
};

export const actions: Actions = {
  save: async (event) => {
    if (!event.locals.permissions.includes('important_announcements.manage'))
      return fail(403, { action: 'save', errors: ['No tienes permiso para administrar avisos.'] });
    const formData = await event.request.formData();
    const values = announcementForm(formData);
    const result = announcementSchema.safeParse(values);
    if (!result.success)
      return fail(400, {
        action: 'save',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!locationId) return fail(503, { action: 'save', errors: [configurationError()] });

    try {
      const client = createAnnouncementsClient(event, env.API_BASE_URL ?? '');
      const payload = apiPayload(result.data);
      if (result.data.id) await client.update(result.data.id, payload);
      else await client.create({ locationId, ...payload });
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'save', errors: response.errors });
    }
  },
  toggle: async (event) => {
    if (!event.locals.permissions.includes('important_announcements.manage'))
      return fail(403, {
        action: 'toggle',
        errors: ['No tienes permiso para administrar avisos.'],
      });
    const formData = await event.request.formData();
    const id = formText(formData.get('id'));
    if (!id) return fail(400, { action: 'toggle', errors: ['El aviso no es válido.'] });
    try {
      await createAnnouncementsClient(event, env.API_BASE_URL ?? '').update(id, {
        active: formBoolean(formData.get('active')),
      });
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'toggle', errors: response.errors });
    }
  },
  delete: async (event) => {
    if (!event.locals.permissions.includes('important_announcements.manage'))
      return fail(403, {
        action: 'delete',
        errors: ['No tienes permiso para administrar avisos.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    if (!id) return fail(400, { action: 'delete', errors: ['El aviso no es válido.'] });
    try {
      await createAnnouncementsClient(event, env.API_BASE_URL ?? '').remove(id);
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'delete', errors: response.errors });
    }
  },
};
