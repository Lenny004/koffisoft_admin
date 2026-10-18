import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

import { createInventoryClient, InventoryApiError } from '$lib/server/inventory';
import { createPurchaseOrdersClient } from '$lib/server/purchase-orders';
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
  const historySupplierId = event.url.searchParams.get('historial') ?? '';
  if (!env.API_BASE_URL || !locationId || !permissions.includes('inventory.read')) {
    return {
      suppliers: [],
      meta: { ...emptyMeta, page },
      search,
      locationId,
      permissions,
      historySupplierId,
      history: null,
      error: permissions.includes('inventory.read') ? configurationError() : undefined,
    };
  }
  try {
    const inventory = createInventoryClient(event, env.API_BASE_URL);
    const purchases = createPurchaseOrdersClient(event, env.API_BASE_URL);
    const [response, profiles] = await Promise.all([
      inventory.listSuppliers({
        locationId,
        page,
        pageSize: PAGE_SIZE,
        search,
        includeInactive: true,
      }),
      permissions.includes('purchase_orders.read')
        ? purchases
            .listSupplierProfiles({ locationId, page: 1, perPage: 100 })
            .catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
    ]);
    const extras = new Map(profiles.data.map((profile) => [profile.id, profile]));
    const suppliers = response.data.map((supplier) => {
      const extra = extras.get(supplier.id);
      return extra
        ? {
            ...supplier,
            deliveryDays: extra.deliveryDays,
            orderReminderDays: extra.orderReminderDays,
            lastOrderDate: extra.lastOrderDate,
            notes: extra.notes,
          }
        : supplier;
    });
    let history = null;
    if (historySupplierId && permissions.includes('purchase_orders.read')) {
      const [detail, orders] = await Promise.all([
        purchases.getSupplierProfile(historySupplierId).catch(() => null),
        purchases.getSupplierHistory(historySupplierId).catch(() => null),
      ]);
      if (orders) {
        history = {
          supplierName: detail?.name ?? 'Proveedor',
          totalOrders: orders.totalOrders,
          totalAmount: orders.totalAmount,
          orders: orders.orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            orderDate: order.orderDate,
            totalAmount: order.totalAmount,
          })),
        };
      }
    }
    return {
      suppliers,
      meta: response.meta,
      search,
      locationId,
      permissions,
      historySupplierId,
      history,
      error: undefined,
    };
  } catch (error) {
    return {
      suppliers: [],
      meta: { ...emptyMeta, page },
      search,
      locationId,
      permissions,
      historySupplierId,
      history: null,
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
      deliveryDays: formText(formData.get('deliveryDays')),
      orderReminderDays: formText(formData.get('orderReminderDays')),
      notes: formText(formData.get('notes')),
      active: booleanValue(formData, 'active', true),
    });
    if (!result.success)
      return fail(400, {
        action: 'save',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    try {
      const { id, locationId, deliveryDays, orderReminderDays, notes, ...payload } = result.data;
      const normalizedPayload = {
        ...payload,
        taxId: payload.taxId || undefined,
        phone: payload.phone || undefined,
        email: payload.email || undefined,
        addressLine: payload.addressLine || undefined,
      };
      const extra = {
        deliveryDays: deliveryDays === '' ? undefined : deliveryDays,
        orderReminderDays: orderReminderDays === '' ? undefined : orderReminderDays,
        notes: notes || undefined,
        active: payload.active,
      };
      const client = createInventoryClient(event, env.API_BASE_URL ?? '');
      const saved = id
        ? await client.updateSupplier(id, locationId, { ...normalizedPayload, ...extra })
        : await client.createSupplier({ locationId, ...normalizedPayload, ...extra });
      if (event.locals.permissions.includes('purchase_orders.manage') && saved.id) {
        await createPurchaseOrdersClient(event, env.API_BASE_URL ?? '')
          .updateSupplierProfile(saved.id, extra)
          .catch(() => undefined);
      }
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
      const locationId = env.DEFAULT_LOCATION_ID ?? '';
      if (!locationId) return fail(503, { action: 'delete', errors: [configurationError()] });
      await createInventoryClient(event, env.API_BASE_URL ?? '').deleteSupplier(id, locationId);
      return { success: true, action: 'delete' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'delete', errors: response.errors });
    }
  },
};
