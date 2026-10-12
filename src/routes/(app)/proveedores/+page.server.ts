import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

import { createInventoryClient, InventoryApiError } from '$lib/server/inventory';
import { formValues, validationErrors } from '$lib/validation/errors';
import { formText } from '$lib/validation/menu';
import { supplierFilterSchema, supplierSchema } from '$lib/validation/inventory';

const PAGE_SIZE = 20;
const emptyMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };

function configurationError(): string {
  return 'No se pudieron cargar los proveedores: configura API_BASE_URL y DEFAULT_LOCATION_ID.';
}

function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof InventoryApiError) return { status: error.status, errors: [error.message] };
  return { status: 502, errors: ['La API de proveedores no está disponible en este momento.'] };
}

function booleanValue(formData: FormData, name: string, defaultValue = false): boolean {
  const values = formData.getAll(name);
  const value = values.at(-1);
  return value === undefined ? defaultValue : value === 'true' || value === 'on';
}

export const load = async (event: RequestEvent) => {
  const filters = supplierFilterSchema.safeParse({
    page: event.url.searchParams.get('page') ?? '1',
    search: event.url.searchParams.get('search') ?? '',
  });
  const { page, search } = filters.success ? filters.data : supplierFilterSchema.parse({});
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;
  if (!env.API_BASE_URL || !locationId || !permissions.includes('inventory.read')) {
    return {
      suppliers: [],
      meta: { ...emptyMeta, page },
      search,
      locationId,
      permissions,
      error: permissions.includes('inventory.read') ? configurationError() : undefined,
    };
  }
  try {
    const response = await createInventoryClient(event, env.API_BASE_URL).listSuppliers({
      locationId,
      page,
      pageSize: PAGE_SIZE,
      search,
      includeInactive: true,
    });
    return {
      suppliers: response.data,
      meta: response.meta,
      search,
      locationId,
      permissions,
      error: undefined,
    };
  } catch (error) {
    return {
      suppliers: [],
      meta: { ...emptyMeta, page },
      search,
      locationId,
      permissions,
      error: error instanceof InventoryApiError ? error.message : configurationError(),
    };
  }
};

export const actions = {
  save: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('suppliers.manage'))
      return fail(403, {
        action: 'save',
        errors: ['No tienes permiso para administrar proveedores.'],
      });
    const formData = await event.request.formData();
    const result = supplierSchema.safeParse({
      id: formText(formData.get('id')),
      locationId: formText(formData.get('locationId')),
      supplierCode: formText(formData.get('supplierCode')),
      name: formText(formData.get('name')),
      taxId: formText(formData.get('taxId')),
      phone: formText(formData.get('phone')),
      email: formText(formData.get('email')),
      addressLine: formText(formData.get('addressLine')),
      active: booleanValue(formData, 'active', true),
    });
    if (!result.success)
      return fail(400, {
        action: 'save',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    try {
      const { id, locationId, ...payload } = result.data;
      const normalizedPayload = {
        ...payload,
        taxId: payload.taxId || undefined,
        phone: payload.phone || undefined,
        email: payload.email || undefined,
        addressLine: payload.addressLine || undefined,
      };
      const client = createInventoryClient(event, env.API_BASE_URL ?? '');
      if (id) await client.updateSupplier(id, normalizedPayload);
      else await client.createSupplier({ locationId, ...normalizedPayload });
      return { success: true, action: 'save' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'save', errors: response.errors });
    }
  },
  delete: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('suppliers.manage'))
      return fail(403, {
        action: 'delete',
        errors: ['No tienes permiso para desactivar proveedores.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    if (!id) return fail(400, { action: 'delete', errors: ['El proveedor no es válido.'] });
    try {
      await createInventoryClient(event, env.API_BASE_URL ?? '').deleteSupplier(id);
      return { success: true, action: 'delete' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'delete', errors: response.errors });
    }
  },
};
