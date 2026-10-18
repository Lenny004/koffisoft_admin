import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

import { createInventoryClient } from '$lib/server/inventory';
import { createResourcesClient, ResourcesApiError } from '$lib/server/resources';
import { formValues, validationErrors } from '$lib/validation/errors';
import { formText } from '$lib/validation/menu';
import {
  completeMaintenanceSchema,
  maintenanceFilterSchema,
  maintenanceSchema,
  resourceFilterSchema,
  resourceSchema,
} from '$lib/validation/resources';

function booleanValue(formData: FormData, name: string, defaultValue = false): boolean {
  const value = formData.getAll(name).at(-1);
  return value === undefined ? defaultValue : value === 'true' || value === 'on';
}

const PAGE_SIZE = 20;
const emptyMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };

function configurationError(): string {
  return 'No se pudieron cargar los recursos: configura API_BASE_URL y DEFAULT_LOCATION_ID.';
}

function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof ResourcesApiError) return { status: error.status, errors: [error.message] };
  return { status: 502, errors: ['La API de recursos no está disponible en este momento.'] };
}

export const load = async (event: RequestEvent) => {
  const parsed = resourceFilterSchema.safeParse({
    page: event.url.searchParams.get('page') ?? '1',
    search: event.url.searchParams.get('search') ?? '',
    category: event.url.searchParams.get('category') ?? '',
    status: event.url.searchParams.get('status') ?? '',
  });
  const filters = parsed.success ? parsed.data : resourceFilterSchema.parse({});
  const maintenanceParsed = maintenanceFilterSchema.safeParse({
    page: event.url.searchParams.get('mPage') ?? '1',
    resourceId: event.url.searchParams.get('resourceId') ?? '',
    completed: event.url.searchParams.get('completed') ?? '',
    dateFrom: event.url.searchParams.get('dateFrom') ?? '',
    dateTo: event.url.searchParams.get('dateTo') ?? '',
  });
  const maintenanceFilters = maintenanceParsed.success
    ? maintenanceParsed.data
    : maintenanceFilterSchema.parse({});
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;
  const empty = {
    resources: [],
    suppliers: [],
    resourceOptions: [],
    maintenances: [],
    meta: { ...emptyMeta, page: filters.page },
    maintenanceMeta: { ...emptyMeta, page: maintenanceFilters.page },
    filters,
    maintenanceFilters,
    locationId,
    permissions,
    lastSchedule: null,
  };

  if (!env.API_BASE_URL || !locationId || !permissions.includes('resources.read')) {
    return {
      ...empty,
      error: permissions.includes('resources.read') ? configurationError() : undefined,
    };
  }

  try {
    const client = createResourcesClient(event, env.API_BASE_URL);
    const maintenanceQuery = {
      locationId,
      page: maintenanceFilters.page,
      pageSize: PAGE_SIZE,
      completed:
        maintenanceFilters.completed === '' ? undefined : maintenanceFilters.completed === 'true',
      dateFrom: maintenanceFilters.dateFrom || undefined,
      dateTo: maintenanceFilters.dateTo || undefined,
    };
    const [resources, suppliers, catalog, maintenances] = await Promise.all([
      client.list({
        locationId,
        page: filters.page,
        pageSize: PAGE_SIZE,
        search: filters.search || undefined,
        category: filters.category || undefined,
        status: filters.status || undefined,
        includeInactive: true,
      }),
      createInventoryClient(event, env.API_BASE_URL)
        .listSuppliers({ locationId, page: 1, pageSize: 100, includeInactive: false })
        .catch(() => ({ data: [] })),
      client
        .list({ locationId, page: 1, pageSize: 100, includeInactive: true })
        .catch(() => ({ data: [] })),
      // El listado por recurso usa GET /resources/admin/:id/maintenance; el global, /maintenance.
      maintenanceFilters.resourceId
        ? client.listResourceMaintenances(maintenanceFilters.resourceId, maintenanceQuery)
        : client.listMaintenances(maintenanceQuery),
    ]);
    return {
      resources: resources.data,
      suppliers: suppliers.data,
      resourceOptions: catalog.data,
      maintenances: maintenances.data,
      meta: resources.meta,
      maintenanceMeta: maintenances.meta,
      filters,
      maintenanceFilters,
      locationId,
      permissions,
      lastSchedule: null,
      error: undefined,
    };
  } catch (error) {
    return {
      ...empty,
      error: error instanceof ResourcesApiError ? error.message : configurationError(),
    };
  }
};

export const actions = {
  save: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('resources.manage')) {
      return fail(403, {
        action: 'save',
        errors: ['No tienes permiso para administrar recursos.'],
      });
    }
    const formData = await event.request.formData();
    const result = resourceSchema.safeParse({
      id: formText(formData.get('id')),
      locationId: formText(formData.get('locationId')),
      resourceCode: formText(formData.get('resourceCode')),
      name: formText(formData.get('name')),
      category: formText(formData.get('category')),
      location: formText(formData.get('location')),
      status: formText(formData.get('status')),
      purchaseDate: formText(formData.get('purchaseDate')),
      cost: formText(formData.get('cost')),
      supplierId: formText(formData.get('supplierId')),
      notes: formText(formData.get('notes')),
      active: booleanValue(formData, 'active', true),
    });
    if (!result.success) {
      return fail(400, {
        action: 'save',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    }
    try {
      const { id, locationId, ...payload } = result.data;
      const normalized = {
        ...payload,
        location: payload.location || undefined,
        purchaseDate: payload.purchaseDate || undefined,
        cost: payload.cost || undefined,
        supplierId: payload.supplierId || undefined,
        notes: payload.notes || undefined,
      };
      const client = createResourcesClient(event, env.API_BASE_URL ?? '');
      if (id) await client.update(id, locationId, normalized);
      else await client.create({ locationId, ...normalized });
      return { success: true, action: 'save' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'save', errors: response.errors });
    }
  },
  schedule: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('resources.manage')) {
      return fail(403, {
        action: 'schedule',
        errors: ['No tienes permiso para programar mantenimientos.'],
      });
    }
    const formData = await event.request.formData();
    const result = maintenanceSchema.safeParse({
      resourceId: formText(formData.get('resourceId')),
      scheduledDate: formText(formData.get('scheduledDate')),
      description: formText(formData.get('description')),
      notes: formText(formData.get('notes')),
    });
    if (!result.success) {
      return fail(400, {
        action: 'schedule',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    }
    try {
      const schedule = await createResourcesClient(
        event,
        env.API_BASE_URL ?? '',
      ).scheduleMaintenance({
        ...result.data,
        notes: result.data.notes || undefined,
      });
      return { success: true, action: 'schedule', schedule };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'schedule', errors: response.errors });
    }
  },
  complete: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('resources.manage')) {
      return fail(403, {
        action: 'complete',
        errors: ['No tienes permiso para completar mantenimientos.'],
      });
    }
    const formData = await event.request.formData();
    const result = completeMaintenanceSchema.safeParse({
      id: formText(formData.get('id')),
      notes: formText(formData.get('notes')),
    });
    if (!result.success) {
      return fail(400, {
        action: 'complete',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    }
    try {
      await createResourcesClient(event, env.API_BASE_URL ?? '').completeMaintenance(
        result.data.id,
        {
          notes: result.data.notes || undefined,
        },
      );
      return { success: true, action: 'complete' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'complete', errors: response.errors });
    }
  },
};
