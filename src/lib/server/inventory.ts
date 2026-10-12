import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type {
  GoodsReceipt,
  GoodsReceiptListItem,
  Ingredient,
  IngredientCategory,
  InventoryAlerts,
  InventoryMovement,
  InventoryPageMeta,
  InventoryUnit,
  Recipe,
  StorageLocation,
  Supplier,
} from '$lib/inventory/types';

export class InventoryApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'InventoryApiError';
  }
}

type QueryValue = string | number | boolean | undefined;

function withQuery(path: string, values: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function createInventoryClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new InventoryApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    listUnits() {
      return request<InventoryUnit[]>('/inventory/admin/catalog/units');
    },
    listCategories() {
      return request<IngredientCategory[]>('/inventory/admin/catalog/categories');
    },
    listStorageLocations(locationId: string) {
      return request<StorageLocation[]>(
        withQuery('/inventory/admin/storage-locations', { locationId }),
      );
    },
    listItems(query: Record<string, QueryValue>) {
      return request<{ data: Ingredient[]; meta: InventoryPageMeta }>(
        withQuery('/inventory/admin/items', query),
      );
    },
    getItem(id: string, locationId: string) {
      return request<Ingredient>(
        withQuery(`/inventory/admin/items/${encodeURIComponent(id)}`, { locationId }),
      );
    },
    createItem(payload: unknown) {
      return request<Ingredient>('/inventory/admin/items', { method: 'POST', json: payload });
    },
    updateItem(id: string, locationId: string, payload: unknown) {
      return request<Ingredient>(
        withQuery(`/inventory/admin/items/${encodeURIComponent(id)}`, { locationId }),
        { method: 'PATCH', json: payload },
      );
    },
    deleteItem(id: string, locationId: string) {
      return request<Ingredient>(
        withQuery(`/inventory/admin/items/${encodeURIComponent(id)}`, { locationId }),
        { method: 'DELETE' },
      );
    },
    listSuppliers(query: Record<string, QueryValue>) {
      return request<{ data: Supplier[]; meta: InventoryPageMeta }>(
        withQuery('/suppliers/admin', query),
      );
    },
    getSupplier(id: string) {
      return request<Supplier>(`/suppliers/admin/${encodeURIComponent(id)}`);
    },
    createSupplier(payload: unknown) {
      return request<Supplier>('/suppliers/admin', { method: 'POST', json: payload });
    },
    updateSupplier(id: string, payload: unknown) {
      return request<Supplier>(`/suppliers/admin/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    deleteSupplier(id: string) {
      return request<Supplier>(`/suppliers/admin/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
    listReceipts(query: Record<string, QueryValue>) {
      return request<{ data: GoodsReceiptListItem[]; meta: InventoryPageMeta }>(
        withQuery('/inventory/admin/receipts', query),
      );
    },
    getReceipt(id: string) {
      return request<GoodsReceipt>(`/inventory/admin/receipts/${encodeURIComponent(id)}`);
    },
    createReceipt(payload: unknown) {
      return request<GoodsReceipt>('/inventory/admin/receipts', { method: 'POST', json: payload });
    },
    listMovements(query: Record<string, QueryValue>) {
      return request<{ data: InventoryMovement[]; meta: InventoryPageMeta }>(
        withQuery('/inventory/admin/movements', query),
      );
    },
    createAdjustment(payload: unknown) {
      return request<InventoryMovement>('/inventory/admin/movements/adjustments', {
        method: 'POST',
        json: payload,
      });
    },
    listAlerts(locationId: string, expiryDays: number) {
      return request<InventoryAlerts>(
        withQuery('/inventory/admin/alerts', { locationId, expiryDays }),
      );
    },
    listRecipes(query: Record<string, QueryValue>) {
      return request<{ data: Recipe[]; meta: InventoryPageMeta }>(
        withQuery('/inventory/admin/recipes', query),
      );
    },
  };
}
