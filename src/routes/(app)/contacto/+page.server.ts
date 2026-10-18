import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { localElSalvadorDateTimeToIso } from '$lib/formatting/dates';
import type { ContactStatus } from '$lib/contact/types';
import { createContactClient, ContactApiError } from '$lib/server/contact';
import { formText } from '$lib/validation/menu';
import { formValues, validationErrors } from '$lib/validation/errors';
import {
  contactEventConversionSchema,
  contactFilterSchema,
  contactReservationConversionSchema,
  contactUpdateSchema,
} from '$lib/validation/contact';

/** Mensaje uniforme cuando faltan variables de entorno requeridas para esta pantalla. */
function configurationError(): string {
  return 'No se pudo cargar la bandeja: configura API_BASE_URL y DEFAULT_LOCATION_ID.';
}

/** Normaliza errores de la API (o fallos de red) a código HTTP y mensajes para fail(). */
function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof ContactApiError) return { status: error.status, errors: [error.message] };
  return { status: 502, errors: ['La API de contacto no está disponible en este momento.'] };
}

/** Bandeja paginada de mensajes de contacto con filtros URL y detalle opcional por selected. */
export const load: PageServerLoad = async (event) => {
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;
  const rawFilters = {
    page: event.url.searchParams.get('page') ?? '1',
    search: event.url.searchParams.get('search') ?? '',
    status: event.url.searchParams.get('status') ?? '',
    includeArchived: event.url.searchParams.get('includeArchived') ?? 'false',
  };
  const parsedFilters = contactFilterSchema.safeParse(rawFilters);
  const filters: {
    page: number;
    search: string;
    status: ContactStatus | '';
    includeArchived: boolean;
  } = parsedFilters.success
    ? { ...parsedFilters.data, status: parsedFilters.data.status ?? '' }
    : { page: 1, search: '', status: '', includeArchived: false };
  const selectedId = event.url.searchParams.get('selected') ?? '';

  if (!permissions.includes('contact.read')) {
    return {
      messages: [],
      selectedMessage: null,
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      filters,
      locationId,
      permissions,
      error: 'No tienes permiso para consultar la bandeja de contacto.',
    };
  }

  if (!env.API_BASE_URL || !locationId) {
    return {
      messages: [],
      selectedMessage: null,
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      filters,
      locationId,
      permissions,
      error: configurationError(),
    };
  }

  try {
    const client = createContactClient(event, env.API_BASE_URL);
    const query = {
      locationId,
      page: filters.page,
      pageSize: 20,
      search: filters.search || undefined,
      status: filters.status || undefined,
      includeArchived: filters.includeArchived,
    };
    const [page, selectedMessage] = await Promise.all([
      client.list(query),
      selectedId ? client.get(selectedId, locationId) : Promise.resolve(null),
    ]);
    return {
      messages: page.data,
      selectedMessage,
      meta: page.meta,
      filters,
      locationId,
      permissions,
      error: undefined,
    };
  } catch (error) {
    return {
      messages: [],
      selectedMessage: null,
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
      filters,
      locationId,
      permissions,
      error: error instanceof ContactApiError ? error.message : configurationError(),
    };
  }
};

/** Gestión de contactos: actualización, conversión a cliente, reserva o evento bajo contact.manage. */
export const actions: Actions = {
  /** Actualiza estado, asignación y archivo del mensaje. */
  update: async (event) => {
    if (!event.locals.permissions.includes('contact.manage'))
      return fail(403, {
        action: 'update',
        errors: ['No tienes permiso para gestionar contactos.'],
      });
    const formData = await event.request.formData();
    const result = contactUpdateSchema.safeParse({
      id: formText(formData.get('id')),
      status: formText(formData.get('status')),
      assignedToUserId: formText(formData.get('assignedToUserId')),
      archived: formText(formData.get('archived')) || 'false',
    });
    if (!result.success)
      return fail(400, {
        action: 'update',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });

    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!locationId) return fail(503, { action: 'update', errors: [configurationError()] });
    try {
      await createContactClient(event, env.API_BASE_URL ?? '').update(result.data.id, locationId, {
        status: result.data.status,
        assignedToUserId: result.data.assignedToUserId || null,
        archived: result.data.archived,
      });
      return { success: true, action: 'update' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'update', errors: response.errors });
    }
  },
  /** Convierte el hilo en cliente registrado en la sede. */
  convertCustomer: async (event) => {
    if (!event.locals.permissions.includes('contact.manage'))
      return fail(403, {
        action: 'convertCustomer',
        errors: ['No tienes permiso para convertir contactos.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!id || !locationId)
      return fail(400, {
        action: 'convertCustomer',
        errors: ['El mensaje o la sede no son válidos.'],
      });
    try {
      await createContactClient(event, env.API_BASE_URL ?? '').convertCustomer(id, locationId);
      return { success: true, action: 'convertCustomer' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'convertCustomer', errors: response.errors });
    }
  },
  /** Abre una reserva interna a partir del mensaje de contacto. */
  convertReservation: async (event) => {
    if (!event.locals.permissions.includes('contact.manage'))
      return fail(403, {
        action: 'convertReservation',
        errors: ['No tienes permiso para convertir contactos.'],
      });
    const formData = await event.request.formData();
    const result = contactReservationConversionSchema.safeParse({
      id: formText(formData.get('id')),
      date: formText(formData.get('date')),
      time: formText(formData.get('time')),
      contactPhone: formText(formData.get('contactPhone')),
      partySize: formText(formData.get('partySize')),
      durationMinutes: formText(formData.get('durationMinutes')),
      preferredSpaceId: formText(formData.get('preferredSpaceId')),
    });
    if (!result.success)
      return fail(400, {
        action: 'convertReservation',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!locationId)
      return fail(503, { action: 'convertReservation', errors: [configurationError()] });
    try {
      await createContactClient(event, env.API_BASE_URL ?? '').convertReservation(
        result.data.id,
        locationId,
        {
          date: result.data.date,
          time: result.data.time,
          contactPhone: result.data.contactPhone,
          partySize: result.data.partySize,
          durationMinutes: result.data.durationMinutes,
          preferredSpaceId: result.data.preferredSpaceId || undefined,
        },
      );
      return { success: true, action: 'convertReservation' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'convertReservation', errors: response.errors });
    }
  },
  /** Crea un evento comercial con fechas convertidas desde hora local SV. */
  convertEvent: async (event) => {
    if (!event.locals.permissions.includes('contact.manage'))
      return fail(403, {
        action: 'convertEvent',
        errors: ['No tienes permiso para convertir contactos.'],
      });
    const formData = await event.request.formData();
    const result = contactEventConversionSchema.safeParse({
      id: formText(formData.get('id')),
      eventType: formText(formData.get('eventType')),
      title: formText(formData.get('title')),
      startsAt: formText(formData.get('startsAt')),
      endsAt: formText(formData.get('endsAt')),
      estimatedGuestCount: formText(formData.get('estimatedGuestCount')),
      budgetTarget: formText(formData.get('budgetTarget')),
    });
    if (!result.success)
      return fail(400, {
        action: 'convertEvent',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!locationId) return fail(503, { action: 'convertEvent', errors: [configurationError()] });
    try {
      await createContactClient(event, env.API_BASE_URL ?? '').convertEvent(
        result.data.id,
        locationId,
        {
          eventType: result.data.eventType,
          title: result.data.title,
          startsAt: localElSalvadorDateTimeToIso(result.data.startsAt),
          endsAt: localElSalvadorDateTimeToIso(result.data.endsAt),
          estimatedGuestCount: result.data.estimatedGuestCount,
          budgetTarget: result.data.budgetTarget || undefined,
        },
      );
      return { success: true, action: 'convertEvent' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'convertEvent', errors: response.errors });
    }
  },
};
