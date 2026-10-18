import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

import { createInventoryClient } from '$lib/server/inventory';
import { createPurchaseOrdersClient, PurchaseOrdersApiError } from '$lib/server/purchase-orders';
import { formValues, jsonFormValue, validationErrors } from '$lib/validation/errors';
import { formText } from '$lib/validation/menu';
import {
  purchaseOrderCreateSchema,
  purchaseOrderFilterSchema,
  purchaseOrderIdSchema,
  purchaseOrderUpdateSchema,
  receivePurchaseOrderSchema,
} from '$lib/validation/purchase-orders';

const PAGE_SIZE = 20;

function configurationError(): string {
  return 'No se pudieron cargar las órdenes: configura API_BASE_URL y DEFAULT_LOCATION_ID.';
}

function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof PurchaseOrdersApiError) {
    return { status: error.status, errors: [error.message] };
  }
  return { status: 502, errors: ['La API de órdenes de compra no está disponible.'] };
}

export const load = async (event: RequestEvent) => {
  const parsed = purchaseOrderFilterSchema.safeParse({
    page: event.url.searchParams.get('page') ?? '1',
    status: event.url.searchParams.get('status') ?? '',
    supplierId: event.url.searchParams.get('supplierId') ?? '',
  });
  const filters = parsed.success ? parsed.data : purchaseOrderFilterSchema.parse({});
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;
  const selectedId = event.url.searchParams.get('orden') ?? '';
  const empty = {
    orders: [],
    selected: null,
    suppliers: [],
    ingredients: [],
    units: [],
    storageLocations: [],
    meta: { page: filters.page, perPage: PAGE_SIZE, total: 0, totalPages: 1 },
    filters,
    locationId,
    permissions,
  };

  if (!env.API_BASE_URL || !locationId || !permissions.includes('purchase_orders.read')) {
    return {
      ...empty,
      error: permissions.includes('purchase_orders.read') ? configurationError() : undefined,
    };
  }

  try {
    const client = createPurchaseOrdersClient(event, env.API_BASE_URL);
    const inventory = createInventoryClient(event, env.API_BASE_URL);
    const [orders, suppliers, ingredients, units, storageLocations, selected] = await Promise.all([
      client.listOrders({
        locationId,
        page: filters.page,
        perPage: PAGE_SIZE,
        status: filters.status || undefined,
        supplierId: filters.supplierId || undefined,
      }),
      inventory.listSuppliers({ locationId, page: 1, pageSize: 100, includeInactive: false }),
      inventory.listItems({ locationId, page: 1, pageSize: 100 }),
      inventory.listUnits(),
      inventory.listStorageLocations(locationId),
      selectedId ? client.getOrder(selectedId).catch(() => null) : Promise.resolve(null),
    ]);
    return {
      orders: orders.data,
      selected,
      suppliers: suppliers.data,
      ingredients: ingredients.data,
      units,
      storageLocations,
      meta: {
        page: orders.page,
        perPage: orders.perPage,
        total: orders.total,
        totalPages: Math.max(1, Math.ceil(orders.total / (orders.perPage || PAGE_SIZE))),
      },
      filters,
      locationId,
      permissions,
      error: undefined,
    };
  } catch (error) {
    return {
      ...empty,
      error: error instanceof PurchaseOrdersApiError ? error.message : configurationError(),
    };
  }
};

export const actions = {
  create: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('purchase_orders.manage')) {
      return fail(403, { action: 'create', errors: ['No tienes permiso para crear órdenes.'] });
    }
    const formData = await event.request.formData();
    const lines = jsonFormValue(formData, 'lines', 'Las líneas no tienen un formato válido.');
    if (lines.error) return fail(400, { action: 'create', errors: [lines.error] });
    const result = purchaseOrderCreateSchema.safeParse({
      locationId: formText(formData.get('locationId')),
      supplierId: formText(formData.get('supplierId')),
      orderDate: formText(formData.get('orderDate')),
      expectedDelivery: formText(formData.get('expectedDelivery')),
      notes: formText(formData.get('notes')),
      lines: lines.value,
    });
    if (!result.success) {
      return fail(400, {
        action: 'create',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    }
    try {
      await createPurchaseOrdersClient(event, env.API_BASE_URL ?? '').createOrder({
        locationId: result.data.locationId,
        supplierId: result.data.supplierId,
        orderDate: result.data.orderDate,
        expectedDelivery: result.data.expectedDelivery || undefined,
        notes: result.data.notes || undefined,
        lines: result.data.lines.map((line) => ({
          ingredientId: line.ingredientId,
          unitId: line.unitId,
          quantityOrdered: Number(line.quantityOrdered),
          unitCost: Number(line.unitCost),
        })),
      });
      return { success: true, action: 'create' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'create', errors: response.errors });
    }
  },
  update: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('purchase_orders.manage')) {
      return fail(403, { action: 'update', errors: ['No tienes permiso para editar órdenes.'] });
    }
    const formData = await event.request.formData();
    const result = purchaseOrderUpdateSchema.safeParse({
      id: formText(formData.get('id')),
      expectedDelivery: formText(formData.get('expectedDelivery')),
      notes: formText(formData.get('notes')),
    });
    if (!result.success) {
      return fail(400, {
        action: 'update',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    }
    try {
      await createPurchaseOrdersClient(event, env.API_BASE_URL ?? '').updateOrder(result.data.id, {
        expectedDelivery: result.data.expectedDelivery || undefined,
        notes: result.data.notes || undefined,
      });
      return { success: true, action: 'update' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'update', errors: response.errors });
    }
  },
  submit: async (event: RequestEvent) => mutateStatus(event, 'submit'),
  approve: async (event: RequestEvent) => mutateStatus(event, 'approve'),
  cancel: async (event: RequestEvent) => mutateStatus(event, 'cancel'),
  receive: async (event: RequestEvent) => {
    if (!event.locals.permissions.includes('purchase_orders.manage')) {
      return fail(403, { action: 'receive', errors: ['No tienes permiso para recibir órdenes.'] });
    }
    const formData = await event.request.formData();
    const lines = jsonFormValue(formData, 'lines', 'Las líneas de recepción no son válidas.');
    if (lines.error) return fail(400, { action: 'receive', errors: [lines.error] });
    const result = receivePurchaseOrderSchema.safeParse({
      id: formText(formData.get('id')),
      storageLocationId: formText(formData.get('storageLocationId')),
      notes: formText(formData.get('notes')),
      lines: lines.value,
    });
    if (!result.success) {
      return fail(400, {
        action: 'receive',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    }
    try {
      await createPurchaseOrdersClient(event, env.API_BASE_URL ?? '').receiveOrder(result.data.id, {
        storageLocationId: result.data.storageLocationId,
        notes: result.data.notes || undefined,
        lines: result.data.lines.map((line) => ({
          lineId: line.lineId,
          quantityReceived: Number(line.quantityReceived),
          lotCode: line.lotCode,
          expiresOn: line.expiresOn || undefined,
        })),
      });
      return { success: true, action: 'receive' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'receive', errors: response.errors });
    }
  },
};

async function mutateStatus(event: RequestEvent, action: 'submit' | 'approve' | 'cancel') {
  if (!event.locals.permissions.includes('purchase_orders.manage')) {
    return fail(403, { action, errors: ['No tienes permiso para cambiar el estado de la orden.'] });
  }
  const formData = await event.request.formData();
  const result = purchaseOrderIdSchema.safeParse({ id: formText(formData.get('id')) });
  if (!result.success) return fail(400, { action, errors: ['La orden no es válida.'] });
  try {
    const client = createPurchaseOrdersClient(event, env.API_BASE_URL ?? '');
    if (action === 'submit') await client.submitOrder(result.data.id);
    if (action === 'approve') await client.approveOrder(result.data.id);
    if (action === 'cancel') await client.cancelOrder(result.data.id);
    return { success: true, action };
  } catch (error) {
    const response = actionError(error);
    return fail(response.status, { action, errors: response.errors });
  }
}
