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

/** Error al consultar o mutar inventario, proveedores o recetas. */
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

/** Serializa filtros de inventario omitiendo valores vacíos. */
function withQuery(path: string, values: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/** Cliente BFF de inventario, compras internas y alertas de stock. */
export function createInventoryClient(event: RequestEvent, apiBaseUrl: string) {
  /** Proxy autenticado hacia rutas `/inventory/admin` y `/suppliers/admin`. */
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new InventoryApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Unidades de medida del catálogo maestro. */
    listUnits() {
      return request<InventoryUnit[]>('/inventory/admin/catalog/units');
    },
    /** Categorías de ingredientes para clasificación. */
    listCategories() {
      return request<IngredientCategory[]>('/inventory/admin/catalog/categories');
    },
    /** Ubicaciones físicas de almacenamiento en la sede. */
    listStorageLocations(locationId: string) {
      return request<StorageLocation[]>(
        withQuery('/inventory/admin/storage-locations', { locationId }),
      );
    },
    /** Ingredientes o ítems paginados con filtros de stock. */
    listItems(query: Record<string, QueryValue>) {
      return request<{ data: Ingredient[]; meta: InventoryPageMeta }>(
        withQuery('/inventory/admin/items', query),
      );
    },
    /** Ficha de un ítem con existencias por ubicación. */
    getItem(id: string, locationId: string) {
      return request<Ingredient>(
        withQuery(`/inventory/admin/items/${encodeURIComponent(id)}`, { locationId }),
      );
    },
    /** Alta de ingrediente en la sede. */
    createItem(payload: unknown) {
      return request<Ingredient>('/inventory/admin/items', { method: 'POST', json: payload });
    },
    /** Actualiza umbrales, nombre o unidad del ítem. */
    updateItem(id: string, locationId: string, payload: unknown) {
      return request<Ingredient>(
        withQuery(`/inventory/admin/items/${encodeURIComponent(id)}`, { locationId }),
        { method: 'PATCH', json: payload },
      );
    },
    /** Baja del ítem en la sede indicada. */
    deleteItem(id: string, locationId: string) {
      return request<Ingredient>(
        withQuery(`/inventory/admin/items/${encodeURIComponent(id)}`, { locationId }),
        { method: 'DELETE' },
      );
    },
    /** Proveedores paginados vinculados al inventario. */
    listSuppliers(query: Record<string, QueryValue>) {
      return request<{ data: Supplier[]; meta: InventoryPageMeta }>(
        withQuery('/suppliers/admin', query),
      );
    },
    /** Datos de contacto y condiciones de un proveedor. */
    getSupplier(id: string, locationId: string) {
      return request<Supplier>(
        withQuery(`/suppliers/admin/${encodeURIComponent(id)}`, { locationId }),
      );
    },
    /** Registra un proveedor operativo. */
    createSupplier(payload: unknown) {
      return request<Supplier>('/suppliers/admin', { method: 'POST', json: payload });
    },
    /** Actualiza información comercial del proveedor. */
    updateSupplier(id: string, locationId: string, payload: unknown) {
      return request<Supplier>(
        withQuery(`/suppliers/admin/${encodeURIComponent(id)}`, { locationId }),
        {
          method: 'PATCH',
          json: payload,
        },
      );
    },
    /** Elimina o desactiva el proveedor en la sede. */
    deleteSupplier(id: string, locationId: string) {
      return request<Supplier>(
        withQuery(`/suppliers/admin/${encodeURIComponent(id)}`, { locationId }),
        { method: 'DELETE' },
      );
    },
    /** Entradas de mercancía (receipts) paginadas. */
    listReceipts(query: Record<string, QueryValue>) {
      return request<{ data: GoodsReceiptListItem[]; meta: InventoryPageMeta }>(
        withQuery('/inventory/admin/receipts', query),
      );
    },
    /** Detalle de una recepción con líneas recibidas. */
    getReceipt(id: string, locationId: string) {
      return request<GoodsReceipt>(
        withQuery(`/inventory/admin/receipts/${encodeURIComponent(id)}`, { locationId }),
      );
    },
    /** Registra una nueva entrada de inventario. */
    createReceipt(payload: unknown) {
      return request<GoodsReceipt>('/inventory/admin/receipts', { method: 'POST', json: payload });
    },
    /** Movimientos de stock (entradas, salidas, transferencias). */
    listMovements(query: Record<string, QueryValue>) {
      return request<{ data: InventoryMovement[]; meta: InventoryPageMeta }>(
        withQuery('/inventory/admin/movements', query),
      );
    },
    /** Ajuste manual de existencias con motivo auditado. */
    createAdjustment(payload: unknown) {
      return request<InventoryMovement>('/inventory/admin/movements/adjustments', {
        method: 'POST',
        json: payload,
      });
    },
    /** Alertas de mínimos y caducidad próxima. */
    listAlerts(locationId: string, expiryDays: number) {
      return request<InventoryAlerts>(
        withQuery('/inventory/admin/alerts', { locationId, expiryDays }),
      );
    },
    /** Recetas o fichas técnicas paginadas. */
    listRecipes(query: Record<string, QueryValue>) {
      return request<{ data: Recipe[]; meta: InventoryPageMeta }>(
        withQuery('/inventory/admin/recipes', query),
      );
    },
  };
}
