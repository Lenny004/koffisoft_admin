import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

import { createInventoryClient, InventoryApiError } from '$lib/server/inventory';
import { localElSalvadorDateTimeToIso } from '$lib/formatting/dates';
import { formValues, validationErrors } from '$lib/validation/errors';
import { formText } from '$lib/validation/menu';
import {
  adjustmentSchema,
  ingredientSchema,
  inventoryFilterSchema,
  receiptSchema,
} from '$lib/validation/inventory';

const PAGE_SIZE = 20;
const emptyMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };

function configurationError(): string {
  return 'No se pudo cargar el inventario: configura API_BASE_URL y DEFAULT_LOCATION_ID.';
}

function actionError(error: unknown, fallback: string): { status: number; errors: string[] } {
  if (error instanceof InventoryApiError) return { status: error.status, errors: [error.message] };
  return { status: 502, errors: [fallback] };
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

function booleanValue(formData: FormData, name: string, defaultValue = false): boolean {
  const values = formData.getAll(name);
  const value = values.at(-1);
  return value === undefined ? defaultValue : value === 'true' || value === 'on';
}

function parseFilters(event: RequestEvent) {
  const result = inventoryFilterSchema.safeParse({
    page: event.url.searchParams.get('page') ?? '1',
    search: event.url.searchParams.get('search') ?? '',
    storageLocationId: event.url.searchParams.get('storageLocationId') ?? '',
    movementPage: event.url.searchParams.get('movementPage') ?? '1',
    ingredientId: event.url.searchParams.get('ingredientId') ?? '',
    movementType: event.url.searchParams.get('movementType') ?? '',
    dateFrom: event.url.searchParams.get('dateFrom') ?? '',
    dateTo: event.url.searchParams.get('dateTo') ?? '',
    expiryDays: event.url.searchParams.get('expiryDays') ?? '30',
  });
  return result.success ? result.data : inventoryFilterSchema.parse({});
}

export const load = async (event: RequestEvent) => {
  const filters = parseFilters(event);
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;
  const selectedId = event.url.searchParams.get('selected') ?? '';

  if (!env.API_BASE_URL || !locationId || !permissions.includes('inventory.read')) {
    return {
      items: [],
      filterItems: [],
      selectedItem: null,
      movements: [],
      receipts: [],
      recipes: [],
      units: [],
      categories: [],
      storageLocations: [],
      suppliers: [],
      alerts: null,
      itemMeta: emptyMeta,
      movementMeta: { ...emptyMeta, page: filters.movementPage },
      receiptMeta: emptyMeta,
      recipeMeta: emptyMeta,
      filters,
      locationId,
      permissions,
      error: permissions.includes('inventory.read') ? configurationError() : undefined,
    };
  }

  try {
    const client = createInventoryClient(event, env.API_BASE_URL);
    const [
      itemPage,
      filterItemPage,
      movementPage,
      receiptPage,
      recipePage,
      units,
      categories,
      storageLocations,
      alerts,
      selectedItem,
      supplierPage,
    ] = await Promise.all([
      client.listItems({
        locationId,
        page: filters.page,
        pageSize: PAGE_SIZE,
        search: filters.search,
        storageLocationId: filters.storageLocationId || undefined,
        includeInactive: true,
      }),
      client.listItems({ locationId, page: 1, pageSize: 100, includeInactive: true }),
      client.listMovements({
        locationId,
        page: filters.movementPage,
        pageSize: PAGE_SIZE,
        storageLocationId: filters.storageLocationId || undefined,
        ingredientId: filters.ingredientId || undefined,
        movementType: filters.movementType || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      }),
      client.listReceipts({ locationId, page: 1, pageSize: PAGE_SIZE, includeInactive: true }),
      client.listRecipes({ locationId, page: 1, pageSize: PAGE_SIZE, includeInactive: true }),
      client.listUnits(),
      client.listCategories(),
      client.listStorageLocations(locationId),
      client.listAlerts(locationId, filters.expiryDays),
      selectedId ? client.getItem(selectedId, locationId) : Promise.resolve(null),
      client.listSuppliers({ locationId, page: 1, pageSize: 100, includeInactive: false }),
    ]);

    return {
      items: itemPage.data,
      filterItems: filterItemPage.data,
      selectedItem,
      movements: movementPage.data,
      receipts: receiptPage.data,
      recipes: recipePage.data,
      units,
      categories,
      storageLocations,
      suppliers: supplierPage.data,
      alerts,
      itemMeta: itemPage.meta,
      movementMeta: movementPage.meta,
      receiptMeta: receiptPage.meta,
      recipeMeta: recipePage.meta,
      filters,
      locationId,
      permissions,
      error: undefined,
    };
  } catch (error) {
    return {
      items: [],
      filterItems: [],
      selectedItem: null,
      movements: [],
      receipts: [],
      recipes: [],
      units: [],
      categories: [],
      storageLocations: [],
      suppliers: [],
      alerts: null,
      itemMeta: emptyMeta,
      movementMeta: { ...emptyMeta, page: filters.movementPage },
      receiptMeta: emptyMeta,
      recipeMeta: emptyMeta,
      filters,
      locationId,
      permissions,
      error: error instanceof InventoryApiError ? error.message : configurationError(),
    };
  }
};

export const actions = {
  saveItem: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('inventory.manage'))
      return fail(403, {
        action: 'saveItem',
        errors: ['No tienes permiso para administrar insumos.'],
      });
    const formData = await event.request.formData();
    const links = jsonValue(
      formData,
      'supplierLinks',
      'Los proveedores asociados no tienen un formato válido.',
    );
    if (links.error) return fail(400, { action: 'saveItem', errors: [links.error] });
    const result = ingredientSchema.safeParse({
      id: formText(formData.get('id')),
      locationId: formText(formData.get('locationId')),
      categoryId: formText(formData.get('categoryId')),
      baseUnitId: formText(formData.get('baseUnitId')),
      sku: formText(formData.get('sku')),
      name: formText(formData.get('name')),
      description: formText(formData.get('description')),
      reorderLevel: formText(formData.get('reorderLevel')),
      trackLots: booleanValue(formData, 'trackLots', true),
      active: booleanValue(formData, 'active', true),
      supplierLinks: links.value,
    });
    if (!result.success)
      return fail(400, {
        action: 'saveItem',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    try {
      const { id, locationId, ...payload } = result.data;
      const client = createInventoryClient(event, env.API_BASE_URL ?? '');
      if (id) await client.updateItem(id, locationId, payload);
      else await client.createItem(payload);
      return { success: true, action: 'saveItem' };
    } catch (error) {
      const response = actionError(error, 'No se pudo guardar el insumo.');
      return fail(response.status, { action: 'saveItem', errors: response.errors });
    }
  },
  deleteItem: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('inventory.manage'))
      return fail(403, {
        action: 'deleteItem',
        errors: ['No tienes permiso para desactivar insumos.'],
      });
    const formData = await event.request.formData();
    const id = formText(formData.get('id'));
    const locationId = formText(formData.get('locationId'));
    if (!id || !locationId)
      return fail(400, { action: 'deleteItem', errors: ['El insumo no es válido.'] });
    try {
      await createInventoryClient(event, env.API_BASE_URL ?? '').deleteItem(id, locationId);
      return { success: true, action: 'deleteItem' };
    } catch (error) {
      const response = actionError(error, 'No se pudo desactivar el insumo.');
      return fail(response.status, { action: 'deleteItem', errors: response.errors });
    }
  },
  receive: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('inventory.receive'))
      return fail(403, {
        action: 'receive',
        errors: ['No tienes permiso para registrar recepciones.'],
      });
    const formData = await event.request.formData();
    const lines = jsonValue(
      formData,
      'lines',
      'Las líneas de recepción no tienen un formato válido.',
    );
    if (lines.error) return fail(400, { action: 'receive', errors: [lines.error] });
    const result = receiptSchema.safeParse({
      locationId: formText(formData.get('locationId')),
      supplierId: formText(formData.get('supplierId')),
      receiptNumber: formText(formData.get('receiptNumber')),
      receivedAt: localElSalvadorDateTimeToIso(formText(formData.get('receivedAt'))),
      storageLocationId: formText(formData.get('storageLocationId')),
      notes: formText(formData.get('notes')),
      lines: lines.value,
    });
    if (!result.success)
      return fail(400, {
        action: 'receive',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    try {
      const payload = {
        ...result.data,
        notes: result.data.notes || undefined,
        lines: result.data.lines.map((line) => ({
          ...line,
          expiresOn: line.expiresOn || undefined,
        })),
      };
      await createInventoryClient(event, env.API_BASE_URL ?? '').createReceipt(payload);
      return { success: true, action: 'receive' };
    } catch (error) {
      const response = actionError(error, 'No se pudo registrar la recepción.');
      return fail(response.status, { action: 'receive', errors: response.errors });
    }
  },
  adjust: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('inventory.adjust'))
      return fail(403, { action: 'adjust', errors: ['No tienes permiso para registrar ajustes.'] });
    const formData = await event.request.formData();
    const result = adjustmentSchema.safeParse({
      operationId: formText(formData.get('operationId')),
      locationId: formText(formData.get('locationId')),
      storageLocationId: formText(formData.get('storageLocationId')),
      ingredientId: formText(formData.get('ingredientId')),
      inventoryLotId: formText(formData.get('inventoryLotId')),
      movementType: formText(formData.get('movementType')),
      quantity: formText(formData.get('quantity')),
      unitCost: formText(formData.get('unitCost')),
      reason: formText(formData.get('reason')),
    });
    if (!result.success)
      return fail(400, {
        action: 'adjust',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    try {
      const { operationId, inventoryLotId, ...payload } = result.data;
      await createInventoryClient(event, env.API_BASE_URL ?? '').createAdjustment({
        ...(operationId ? { operationId } : {}),
        ...payload,
        ...(inventoryLotId ? { inventoryLotId } : {}),
      });
      return { success: true, action: 'adjust' };
    } catch (error) {
      const response = actionError(error, 'No se pudo registrar el ajuste.');
      return fail(response.status, { action: 'adjust', errors: response.errors });
    }
  },
};
