import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { createEventsClient, EventsApiError } from '$lib/server/events';
import { emptyPageMeta } from '$lib/server/reservations';
import { createReservationsClient, ReservationsApiError } from '$lib/server/reservations';
import { formText } from '$lib/validation/menu';
import {
  eventSchema,
  packageSchema,
  quoteSchema,
  quoteStatusSchema,
  requirementSchema,
  spaceBookingSchema,
  updateRequirementSchema,
  validationMessages,
} from '$lib/validation/events';
import { localElSalvadorDateTimeToIso } from '$lib/formatting/dates';

const PAGE_SIZE = 20;
const EVENT_STATUSES = [
  'Inquiry',
  'Quoted',
  'Negotiating',
  'Tentative',
  'Confirmed',
  'InProgress',
  'Completed',
  'Cancelled',
  'Lost',
] as const;

function configurationError(): string {
  return 'No se pudieron cargar los eventos: configura API_BASE_URL y DEFAULT_LOCATION_ID.';
}

function actionError(error: unknown, fallback: string): { status: number; errors: string[] } {
  if (error instanceof EventsApiError || error instanceof ReservationsApiError)
    return { status: error.status, errors: [error.message] };
  return { status: 502, errors: [fallback] };
}

function booleanValue(formData: FormData, name: string, defaultValue = false): boolean {
  const values = formData.getAll(name);
  const value = values.at(-1);
  return value === undefined ? defaultValue : value === 'true' || value === 'on';
}

function optional(value: string | undefined): string | undefined {
  return value || undefined;
}

function jsonValue(
  formData: FormData,
  name: string,
  message: string,
): { value?: unknown; error?: string } {
  try {
    return { value: JSON.parse(formText(formData.get(name)) || '[]') };
  } catch {
    return { error: message };
  }
}

function eventForm(formData: FormData) {
  return {
    id: formText(formData.get('id')),
    locationId: formText(formData.get('locationId')),
    eventType: formText(formData.get('eventType')),
    title: formText(formData.get('title')),
    contactName: formText(formData.get('contactName')),
    contactPhone: formText(formData.get('contactPhone')),
    contactEmail: formText(formData.get('contactEmail')),
    startsAt: localElSalvadorDateTimeToIso(formText(formData.get('startsAt'))),
    endsAt: localElSalvadorDateTimeToIso(formText(formData.get('endsAt'))),
    setupStartsAt: localElSalvadorDateTimeToIso(formText(formData.get('setupStartsAt'))),
    estimatedGuestCount: formText(formData.get('estimatedGuestCount')),
    confirmedGuestCount: formText(formData.get('confirmedGuestCount')),
    budgetTarget: formText(formData.get('budgetTarget')),
    status: formText(formData.get('status')),
    specialRequirements: formText(formData.get('specialRequirements')),
    internalNotes: formText(formData.get('internalNotes')),
    preferredLanguage: formText(formData.get('preferredLanguage')) || 'es',
  };
}

export const load: PageServerLoad = async (event) => {
  const page = Math.max(1, Number(event.url.searchParams.get('page') || 1));
  const statusParam = event.url.searchParams.get('status') ?? '';
  const status = EVENT_STATUSES.includes(statusParam as (typeof EVENT_STATUSES)[number])
    ? statusParam
    : '';
  const selectedId = event.url.searchParams.get('selected') ?? '';
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;

  if (!env.API_BASE_URL || !locationId) {
    return {
      events: [],
      spaces: [],
      packages: [],
      selectedEvent: null,
      quotes: [],
      meta: emptyPageMeta,
      filters: { page, status },
      locationId,
      permissions,
      error: configurationError(),
    };
  }

  try {
    const eventsClient = createEventsClient(event, env.API_BASE_URL);
    const reservationsClient = createReservationsClient(event, env.API_BASE_URL);
    const [eventsResponse, packages, spaces, selectedEvent] = await Promise.all([
      eventsClient.listEvents({
        locationId,
        page,
        pageSize: PAGE_SIZE,
        status: status || undefined,
      }),
      eventsClient.listPackages({ locationId, includeInactive: true }),
      permissions.includes('reservations.read')
        ? reservationsClient.listSpaces({ locationId, includeInactive: false })
        : Promise.resolve([]),
      selectedId ? eventsClient.getEvent(selectedId) : Promise.resolve(null),
    ]);
    const quotes = selectedEvent ? (await eventsClient.listQuotes(selectedEvent.id)).data : [];
    return {
      events: eventsResponse.data,
      spaces,
      packages,
      selectedEvent,
      quotes,
      meta: eventsResponse.meta,
      filters: { page, status },
      locationId,
      permissions,
      error: undefined,
    };
  } catch (error) {
    return {
      events: [],
      spaces: [],
      packages: [],
      selectedEvent: null,
      quotes: [],
      meta: emptyPageMeta,
      filters: { page, status },
      locationId,
      permissions,
      error:
        error instanceof EventsApiError || error instanceof ReservationsApiError
          ? error.message
          : configurationError(),
    };
  }
};

export const actions: Actions = {
  saveEvent: async (event) => {
    if (!event.locals.permissions.includes('events.manage'))
      return fail(403, {
        action: 'saveEvent',
        errors: ['No tienes permiso para administrar eventos.'],
      });
    const formData = await event.request.formData();
    const result = eventSchema.safeParse(eventForm(formData));
    if (!result.success)
      return fail(400, { action: 'saveEvent', errors: validationMessages(result.error) });
    const { id, locationId, ...data } = result.data;
    const payload = {
      ...data,
      contactEmail: optional(data.contactEmail),
      setupStartsAt: optional(data.setupStartsAt),
      confirmedGuestCount: data.confirmedGuestCount || undefined,
      budgetTarget: optional(data.budgetTarget),
      specialRequirements: optional(data.specialRequirements),
      internalNotes: optional(data.internalNotes),
      preferredLanguage: data.preferredLanguage,
    };
    try {
      const client = createEventsClient(event, env.API_BASE_URL ?? '');
      if (id) {
        const { preferredLanguage, ...updatePayload } = payload;
        void preferredLanguage;
        await client.updateEvent(id, updatePayload);
      } else {
        await client.createEvent({ locationId, source: 'admin', ...payload });
      }
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo guardar el evento.');
      return fail(response.status, { action: 'saveEvent', errors: response.errors });
    }
  },
  deleteEvent: async (event) => {
    if (!event.locals.permissions.includes('events.manage'))
      return fail(403, {
        action: 'deleteEvent',
        errors: ['No tienes permiso para cancelar eventos.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    if (!id) return fail(400, { action: 'deleteEvent', errors: ['El evento no es válido.'] });
    try {
      await createEventsClient(event, env.API_BASE_URL ?? '').deleteEvent(id);
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo cancelar el evento.');
      return fail(response.status, { action: 'deleteEvent', errors: response.errors });
    }
  },
  bookSpace: async (event) => {
    if (!event.locals.permissions.includes('events.manage'))
      return fail(403, {
        action: 'bookSpace',
        errors: ['No tienes permiso para reservar espacios.'],
      });
    const formData = await event.request.formData();
    const result = spaceBookingSchema.safeParse({
      eventId: formText(formData.get('eventId')),
      venueSpaceId: formText(formData.get('venueSpaceId')),
      startsAt: localElSalvadorDateTimeToIso(formText(formData.get('startsAt'))),
      endsAt: localElSalvadorDateTimeToIso(formText(formData.get('endsAt'))),
      setupStartsAt: localElSalvadorDateTimeToIso(formText(formData.get('setupStartsAt'))),
      teardownEndsAt: localElSalvadorDateTimeToIso(formText(formData.get('teardownEndsAt'))),
      bookingStatus: formText(formData.get('bookingStatus')),
      capacityReserved: formText(formData.get('capacityReserved')),
      holdExpiresAt: localElSalvadorDateTimeToIso(formText(formData.get('holdExpiresAt'))),
    });
    if (!result.success)
      return fail(400, { action: 'bookSpace', errors: validationMessages(result.error) });
    const { eventId, ...payload } = result.data;
    try {
      await createEventsClient(event, env.API_BASE_URL ?? '').createSpaceBooking(eventId, {
        ...payload,
        setupStartsAt: optional(payload.setupStartsAt),
        teardownEndsAt: optional(payload.teardownEndsAt),
        holdExpiresAt: optional(payload.holdExpiresAt),
      });
      return { success: true };
    } catch (error) {
      const response = actionError(
        error,
        'No se pudo reservar el espacio; revisa si existe un solapamiento.',
      );
      return fail(response.status, { action: 'bookSpace', errors: response.errors });
    }
  },
  releaseSpace: async (event) => {
    if (!event.locals.permissions.includes('events.manage'))
      return fail(403, {
        action: 'releaseSpace',
        errors: ['No tienes permiso para liberar espacios.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    if (!id)
      return fail(400, { action: 'releaseSpace', errors: ['La reserva de espacio no es válida.'] });
    try {
      await createEventsClient(event, env.API_BASE_URL ?? '').releaseSpaceBooking(id);
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo liberar el espacio.');
      return fail(response.status, { action: 'releaseSpace', errors: response.errors });
    }
  },
  savePackage: async (event) => {
    if (!event.locals.permissions.includes('events.manage'))
      return fail(403, {
        action: 'savePackage',
        errors: ['No tienes permiso para administrar paquetes.'],
      });
    const formData = await event.request.formData();
    const lines = jsonValue(formData, 'lines', 'Las líneas del paquete deben ser JSON válido.');
    if (lines.error) return fail(400, { action: 'savePackage', errors: [lines.error] });
    const result = packageSchema.safeParse({
      id: formText(formData.get('id')),
      locationId: formText(formData.get('locationId')),
      packageCode: formText(formData.get('packageCode')),
      nameEs: formText(formData.get('nameEs')),
      nameEn: formText(formData.get('nameEn')),
      descriptionEs: formText(formData.get('descriptionEs')),
      descriptionEn: formText(formData.get('descriptionEn')),
      pricingModel: formText(formData.get('pricingModel')),
      basePrice: formText(formData.get('basePrice')),
      minGuestCount: formText(formData.get('minGuestCount')),
      maxGuestCount: formText(formData.get('maxGuestCount')),
      active: booleanValue(formData, 'active', true),
      lines: lines.value,
    });
    if (!result.success)
      return fail(400, { action: 'savePackage', errors: validationMessages(result.error) });
    try {
      const {
        id,
        locationId,
        minGuestCount,
        maxGuestCount,
        lines: packageLines,
        ...payload
      } = result.data;
      const normalizedLines = packageLines.map(({ menuItemVariantId, ...line }) => ({
        ...line,
        ...(menuItemVariantId ? { menuItemVariantId } : {}),
      }));
      const normalizedPayload = {
        ...payload,
        lines: normalizedLines,
        ...(minGuestCount === '' ? {} : { minGuestCount }),
        ...(maxGuestCount === '' ? {} : { maxGuestCount }),
      };
      const client = createEventsClient(event, env.API_BASE_URL ?? '');
      if (id) await client.updatePackage(id, normalizedPayload);
      else await client.createPackage({ locationId, ...normalizedPayload });
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo guardar el paquete.');
      return fail(response.status, { action: 'savePackage', errors: response.errors });
    }
  },
  deletePackage: async (event) => {
    if (!event.locals.permissions.includes('events.manage'))
      return fail(403, {
        action: 'deletePackage',
        errors: ['No tienes permiso para desactivar paquetes.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    if (!id) return fail(400, { action: 'deletePackage', errors: ['El paquete no es válido.'] });
    try {
      await createEventsClient(event, env.API_BASE_URL ?? '').deletePackage(id);
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo desactivar el paquete.');
      return fail(response.status, { action: 'deletePackage', errors: response.errors });
    }
  },
  createQuote: async (event) => {
    if (!event.locals.permissions.includes('event_quotes.manage'))
      return fail(403, {
        action: 'createQuote',
        errors: ['No tienes permiso para administrar cotizaciones.'],
      });
    const formData = await event.request.formData();
    const lines = jsonValue(
      formData,
      'lines',
      'Las líneas de la cotización deben ser JSON válido.',
    );
    if (lines.error) return fail(400, { action: 'createQuote', errors: [lines.error] });
    const result = quoteSchema.safeParse({
      eventId: formText(formData.get('eventId')),
      eventPackageId: formText(formData.get('eventPackageId')),
      validUntil: formText(formData.get('validUntil')),
      termsEs: formText(formData.get('termsEs')),
      termsEn: formText(formData.get('termsEn')),
      lines: lines.value,
    });
    if (!result.success)
      return fail(400, { action: 'createQuote', errors: validationMessages(result.error) });
    const { eventId, lines: quoteLines, ...payload } = result.data;
    const normalizedLines = quoteLines.map(
      ({ eventPackageLineId, menuItemVariantId, ...line }) => ({
        ...line,
        ...(eventPackageLineId ? { eventPackageLineId } : {}),
        ...(menuItemVariantId ? { menuItemVariantId } : {}),
      }),
    );
    try {
      await createEventsClient(event, env.API_BASE_URL ?? '').createQuote(eventId, {
        ...payload,
        lines: normalizedLines,
        eventPackageId: optional(payload.eventPackageId),
        termsEs: optional(payload.termsEs),
        termsEn: optional(payload.termsEn),
      });
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo crear la cotización.');
      return fail(response.status, { action: 'createQuote', errors: response.errors });
    }
  },
  updateQuoteStatus: async (event) => {
    if (!event.locals.permissions.includes('event_quotes.manage'))
      return fail(403, {
        action: 'updateQuoteStatus',
        errors: ['No tienes permiso para cambiar cotizaciones.'],
      });
    const formData = await event.request.formData();
    const result = quoteStatusSchema.safeParse({
      quoteId: formText(formData.get('quoteId')),
      status: formText(formData.get('status')),
    });
    if (!result.success)
      return fail(400, { action: 'updateQuoteStatus', errors: validationMessages(result.error) });
    try {
      await createEventsClient(event, env.API_BASE_URL ?? '').updateQuoteStatus(
        result.data.quoteId,
        result.data.status,
      );
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo actualizar el estado de la cotización.');
      return fail(response.status, { action: 'updateQuoteStatus', errors: response.errors });
    }
  },
  saveRequirement: async (event) => {
    if (!event.locals.permissions.includes('events.manage'))
      return fail(403, {
        action: 'saveRequirement',
        errors: ['No tienes permiso para administrar requisitos.'],
      });
    const formData = await event.request.formData();
    const result = requirementSchema.safeParse({
      eventId: formText(formData.get('eventId')),
      requirementType: formText(formData.get('requirementType')),
      description: formText(formData.get('description')),
      guestCount: formText(formData.get('guestCount')),
      severity: formText(formData.get('severity')),
      status: formText(formData.get('status')),
    });
    if (!result.success)
      return fail(400, { action: 'saveRequirement', errors: validationMessages(result.error) });
    const { eventId, ...payload } = result.data;
    try {
      await createEventsClient(event, env.API_BASE_URL ?? '').createRequirement(eventId, {
        ...payload,
        guestCount: payload.guestCount || undefined,
      });
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo crear el requisito.');
      return fail(response.status, { action: 'saveRequirement', errors: response.errors });
    }
  },
  updateRequirement: async (event) => {
    if (!event.locals.permissions.includes('events.manage'))
      return fail(403, {
        action: 'updateRequirement',
        errors: ['No tienes permiso para resolver requisitos.'],
      });
    const formData = await event.request.formData();
    const result = updateRequirementSchema.safeParse({
      requirementId: formText(formData.get('requirementId')),
      description: formText(formData.get('description')),
      guestCount: formText(formData.get('guestCount')),
      severity: formText(formData.get('severity')),
      status: formText(formData.get('status')),
      resolvedAt: localElSalvadorDateTimeToIso(formText(formData.get('resolvedAt'))),
    });
    if (!result.success)
      return fail(400, { action: 'updateRequirement', errors: validationMessages(result.error) });
    const { requirementId, ...payload } = result.data;
    try {
      await createEventsClient(event, env.API_BASE_URL ?? '').updateRequirement(requirementId, {
        ...payload,
        guestCount: payload.guestCount || undefined,
        resolvedAt: optional(payload.resolvedAt),
      });
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo actualizar el requisito.');
      return fail(response.status, { action: 'updateRequirement', errors: response.errors });
    }
  },
  deleteRequirement: async (event) => {
    if (!event.locals.permissions.includes('events.manage'))
      return fail(403, {
        action: 'deleteRequirement',
        errors: ['No tienes permiso para eliminar requisitos.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    if (!id)
      return fail(400, { action: 'deleteRequirement', errors: ['El requisito no es válido.'] });
    try {
      await createEventsClient(event, env.API_BASE_URL ?? '').deleteRequirement(id);
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo eliminar el requisito.');
      return fail(response.status, { action: 'deleteRequirement', errors: response.errors });
    }
  },
};
