import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { formText } from '$lib/validation/menu';
import {
  assignTablesSchema,
  createReservationSchema,
  diningTableSchema,
  reservationFilterSchema,
  validationMessages,
  venueSpaceSchema,
} from '$lib/validation/reservations';
import {
  emptyPageMeta,
  ReservationsApiError,
  createReservationsClient,
} from '$lib/server/reservations';
import type {
  ReservationAction,
  ReservationPage,
  ReservationStatus,
} from '$lib/reservations/types';

const PAGE_SIZE = 20;
const RESERVATION_ACTIONS = ['confirm', 'seat', 'complete', 'cancel', 'no-show'] as const;

function configurationError(): string {
  return 'No se pudieron cargar las reservaciones: configura API_BASE_URL y DEFAULT_LOCATION_ID.';
}

function actionError(error: unknown, fallback: string): { status: number; errors: string[] } {
  if (error instanceof ReservationsApiError)
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

function parseJson(value: string, message: string): { value?: unknown; error?: string } {
  try {
    return { value: JSON.parse(value) };
  } catch {
    return { error: message };
  }
}

async function listFilteredReservations(
  client: ReturnType<typeof createReservationsClient>,
  locationId: string,
  page: number,
  search: string,
  filters: { dateFrom?: string; dateTo?: string; status?: string; spaceId?: string },
): Promise<ReservationPage> {
  const query = {
    locationId,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    status: (filters.status || undefined) as ReservationStatus | undefined,
    spaceId: filters.spaceId || undefined,
  };
  if (!search) return client.listReservations({ ...query, page, pageSize: PAGE_SIZE });

  const firstPage = await client.listReservations({ ...query, page: 1, pageSize: 100 });
  const allReservations = [...firstPage.data];
  for (let currentPage = 2; currentPage <= firstPage.meta.totalPages; currentPage += 1) {
    const nextPage = await client.listReservations({ ...query, page: currentPage, pageSize: 100 });
    allReservations.push(...nextPage.data);
  }
  const normalizedSearch = search.toLocaleLowerCase();
  const filtered = allReservations.filter((reservation) =>
    [reservation.reservationCode, reservation.contactNameSnapshot, reservation.contactPhoneSnapshot]
      .join(' ')
      .toLocaleLowerCase()
      .includes(normalizedSearch),
  );
  const offset = (page - 1) * PAGE_SIZE;
  return {
    data: filtered.slice(offset, offset + PAGE_SIZE),
    meta: {
      page,
      pageSize: PAGE_SIZE,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    },
  };
}

export const load: PageServerLoad = async (event) => {
  const rawFilters = {
    page: event.url.searchParams.get('page') ?? '1',
    dateFrom: event.url.searchParams.get('dateFrom') ?? '',
    dateTo: event.url.searchParams.get('dateTo') ?? '',
    status: event.url.searchParams.get('status') ?? '',
    spaceId: event.url.searchParams.get('spaceId') ?? '',
  };
  const filters = reservationFilterSchema.safeParse(rawFilters).success
    ? reservationFilterSchema.parse(rawFilters)
    : { page: 1, dateFrom: '', dateTo: '', status: '', spaceId: '' };
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const selectedId = event.url.searchParams.get('selected') ?? '';
  const view = event.url.searchParams.get('view') === 'day' ? 'day' : 'table';
  const search = event.url.searchParams.get('search')?.trim() ?? '';
  const permissions = event.locals.permissions;

  if (!env.API_BASE_URL || !locationId) {
    return {
      reservations: [],
      spaces: [],
      tables: [],
      selectedReservation: null,
      meta: emptyPageMeta,
      filters,
      search,
      view,
      locationId,
      permissions,
      error: configurationError(),
    };
  }

  try {
    const client = createReservationsClient(event, env.API_BASE_URL);
    const [reservationsResponse, spaces, tables, selectedReservation] = await Promise.all([
      listFilteredReservations(client, locationId, filters.page, search, filters),
      client.listSpaces({ locationId, includeInactive: true }),
      client.listTables(),
      selectedId ? client.getReservation(selectedId) : Promise.resolve(null),
    ]);

    return {
      reservations: reservationsResponse.data,
      spaces,
      tables,
      selectedReservation,
      meta: reservationsResponse.meta,
      filters,
      search,
      view,
      locationId,
      permissions,
      error: undefined,
    };
  } catch (error) {
    return {
      reservations: [],
      spaces: [],
      tables: [],
      selectedReservation: null,
      meta: emptyPageMeta,
      filters,
      search,
      view,
      locationId,
      permissions,
      error: error instanceof ReservationsApiError ? error.message : configurationError(),
    };
  }
};

export const actions: Actions = {
  createReservation: async (event) => {
    if (!event.locals.permissions.includes('reservations.manage'))
      return fail(403, {
        action: 'createReservation',
        errors: ['No tienes permiso para crear reservas.'],
      });
    const formData = await event.request.formData();
    const parsedTables = parseJson(
      formText(formData.get('tableIds')) || '[]',
      'La selección de mesas no tiene un formato válido.',
    );
    if (parsedTables.error)
      return fail(400, { action: 'createReservation', errors: [parsedTables.error] });
    const result = createReservationSchema.safeParse({
      locationId: formText(formData.get('locationId')),
      customerId: formText(formData.get('customerId')),
      contactName: formText(formData.get('contactName')),
      contactPhone: formText(formData.get('contactPhone')),
      contactEmail: formText(formData.get('contactEmail')),
      date: formText(formData.get('date')),
      time: formText(formData.get('time')),
      partySize: formText(formData.get('partySize')),
      durationMinutes: formText(formData.get('durationMinutes')),
      preferredSpaceId: formText(formData.get('preferredSpaceId')),
      internalNotes: formText(formData.get('internalNotes')),
      status: formText(formData.get('status')),
      tableIds: parsedTables.value,
    });
    if (!result.success)
      return fail(400, { action: 'createReservation', errors: validationMessages(result.error) });
    try {
      await createReservationsClient(event, env.API_BASE_URL ?? '').createAdminReservation({
        ...result.data,
        customerId: optional(result.data.customerId),
        contactName: optional(result.data.contactName),
        contactPhone: optional(result.data.contactPhone),
        contactEmail: optional(result.data.contactEmail),
        preferredSpaceId: optional(result.data.preferredSpaceId),
        internalNotes: optional(result.data.internalNotes),
      });
      return { success: true, action: 'createReservation' };
    } catch (error) {
      const response = actionError(error, 'No se pudo crear la reserva interna.');
      return fail(response.status, { action: 'createReservation', errors: response.errors });
    }
  },
  transition: async (event) => {
    if (!event.locals.permissions.includes('reservations.manage'))
      return fail(403, {
        action: 'transition',
        errors: ['No tienes permiso para gestionar reservas.'],
      });
    const formData = await event.request.formData();
    const id = formText(formData.get('id'));
    const action = formText(formData.get('transition')) as ReservationAction;
    if (!id || !RESERVATION_ACTIONS.includes(action))
      return fail(400, {
        action: 'transition',
        errors: ['La transición de reserva no es válida.'],
      });
    try {
      await createReservationsClient(event, env.API_BASE_URL ?? '').transitionReservation(
        id,
        action,
      );
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo actualizar el estado de la reserva.');
      return fail(response.status, { action: 'transition', errors: response.errors });
    }
  },
  assignTables: async (event) => {
    if (!event.locals.permissions.includes('reservations.manage'))
      return fail(403, {
        action: 'assignTables',
        errors: ['No tienes permiso para asignar mesas.'],
      });
    const formData = await event.request.formData();
    const parsedTables = parseJson(
      formText(formData.get('tableIds')) || '[]',
      'La selección de mesas no tiene un formato válido.',
    );
    if (parsedTables.error)
      return fail(400, { action: 'assignTables', errors: [parsedTables.error] });
    const result = assignTablesSchema.safeParse({
      reservationId: formText(formData.get('reservationId')),
      tableIds: parsedTables.value,
    });
    if (!result.success)
      return fail(400, { action: 'assignTables', errors: validationMessages(result.error) });
    try {
      await createReservationsClient(event, env.API_BASE_URL ?? '').assignTables(
        result.data.reservationId,
        result.data.tableIds,
      );
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudieron asignar las mesas.');
      return fail(response.status, { action: 'assignTables', errors: response.errors });
    }
  },
  saveSpace: async (event) => {
    if (!event.locals.permissions.includes('reservations.manage'))
      return fail(403, {
        action: 'saveSpace',
        errors: ['No tienes permiso para administrar espacios.'],
      });
    const formData = await event.request.formData();
    const result = venueSpaceSchema.safeParse({
      id: formText(formData.get('id')),
      locationId: formText(formData.get('locationId')),
      code: formText(formData.get('code')),
      nameEs: formText(formData.get('nameEs')),
      nameEn: formText(formData.get('nameEn')),
      spaceType: formText(formData.get('spaceType')),
      seatedCapacity: formText(formData.get('seatedCapacity')),
      standingCapacity: formText(formData.get('standingCapacity')),
      allowsTableReservation: booleanValue(formData, 'allowsTableReservation', true),
      allowsPrivateEvent: booleanValue(formData, 'allowsPrivateEvent'),
      active: booleanValue(formData, 'active', true),
    });
    if (!result.success)
      return fail(400, { action: 'saveSpace', errors: validationMessages(result.error) });
    try {
      const { id, locationId, standingCapacity, ...payload } = result.data;
      const normalizedPayload = {
        ...payload,
        ...(standingCapacity === '' ? {} : { standingCapacity }),
      };
      const client = createReservationsClient(event, env.API_BASE_URL ?? '');
      if (id) await client.updateSpace(id, normalizedPayload);
      else await client.createSpace({ locationId, ...normalizedPayload });
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo guardar el espacio.');
      return fail(response.status, { action: 'saveSpace', errors: response.errors });
    }
  },
  deleteSpace: async (event) => {
    if (!event.locals.permissions.includes('reservations.manage'))
      return fail(403, {
        action: 'deleteSpace',
        errors: ['No tienes permiso para administrar espacios.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    if (!id) return fail(400, { action: 'deleteSpace', errors: ['El espacio no es válido.'] });
    try {
      await createReservationsClient(event, env.API_BASE_URL ?? '').deleteSpace(id);
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo desactivar el espacio.');
      return fail(response.status, { action: 'deleteSpace', errors: response.errors });
    }
  },
  saveTable: async (event) => {
    if (!event.locals.permissions.includes('reservations.manage'))
      return fail(403, {
        action: 'saveTable',
        errors: ['No tienes permiso para administrar mesas.'],
      });
    const formData = await event.request.formData();
    const result = diningTableSchema.safeParse({
      id: formText(formData.get('id')),
      spaceId: formText(formData.get('spaceId')),
      tableCode: formText(formData.get('tableCode')),
      name: formText(formData.get('name')),
      seatCount: formText(formData.get('seatCount')),
      shape: formText(formData.get('shape')),
      active: booleanValue(formData, 'active', true),
    });
    if (!result.success)
      return fail(400, { action: 'saveTable', errors: validationMessages(result.error) });
    try {
      const { id, ...payload } = result.data;
      const client = createReservationsClient(event, env.API_BASE_URL ?? '');
      if (id) {
        const { spaceId, ...updatePayload } = payload;
        void spaceId;
        await client.updateTable(id, updatePayload);
      } else await client.createTable(payload);
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo guardar la mesa.');
      return fail(response.status, { action: 'saveTable', errors: response.errors });
    }
  },
  deleteTable: async (event) => {
    if (!event.locals.permissions.includes('reservations.manage'))
      return fail(403, {
        action: 'deleteTable',
        errors: ['No tienes permiso para administrar mesas.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    if (!id) return fail(400, { action: 'deleteTable', errors: ['La mesa no es válida.'] });
    try {
      await createReservationsClient(event, env.API_BASE_URL ?? '').deleteTable(id);
      return { success: true };
    } catch (error) {
      const response = actionError(error, 'No se pudo desactivar la mesa.');
      return fail(response.status, { action: 'deleteTable', errors: response.errors });
    }
  },
};
