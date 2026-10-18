import type { RequestEvent } from '@sveltejs/kit';

import type {
  PurchaseOrder,
  PurchaseOrderPage,
  SupplierOrderHistory,
  SupplierProfile,
} from '$lib/purchase-orders/types';
import { apiErrorMessage, apiRequest, readJson } from './api';
import { withQuery, type QueryValue } from './query';

/** Error al avanzar órdenes de compra o perfiles de proveedor. */
export class PurchaseOrdersApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PurchaseOrdersApiError';
  }
}

/** Cliente BFF de compras a proveedores y catálogo de perfiles. */
export function createPurchaseOrdersClient(event: RequestEvent, apiBaseUrl: string) {
  /** Proxy autenticado hacia `/purchase-orders` y `/suppliers`. */
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) {
      throw new PurchaseOrdersApiError(response.status, await apiErrorMessage(response));
    }
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Órdenes paginadas según filtros administrativos. */
    listOrders(query: Record<string, QueryValue>) {
      return request<PurchaseOrderPage>(withQuery('/purchase-orders', query));
    },
    /** Detalle completo de una orden incluyendo líneas. */
    getOrder(id: string) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}`);
    },
    /** Crea una orden en borrador. */
    createOrder(payload: unknown) {
      return request<PurchaseOrder>('/purchase-orders', { method: 'POST', json: payload });
    },
    /** Actualiza cabecera o metadatos editables en borrador. */
    updateOrder(id: string, payload: unknown) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    /** Reemplaza todas las líneas mientras la orden sigue en borrador. */
    replaceDraftLines(id: string, payload: unknown) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}/lines`, {
        method: 'PUT',
        json: payload,
      });
    },
    /** Envía la orden a revisión o aprobación. */
    submitOrder(id: string) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}/submit`, {
        method: 'POST',
      });
    },
    /** Aprueba una orden pendiente de autorización. */
    approveOrder(id: string) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
      });
    },
    /** Cancela una orden que aún no fue recibida por completo. */
    cancelOrder(id: string) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}/cancel`, {
        method: 'POST',
      });
    },
    /** Registra recepción parcial o total de mercancía. */
    receiveOrder(id: string, payload: unknown) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}/receive`, {
        method: 'POST',
        json: payload,
      });
    },
    /** Perfiles de proveedor paginados para selección en órdenes. */
    listSupplierProfiles(query: Record<string, QueryValue>) {
      return request<{
        data: SupplierProfile[];
        total: number;
        page: number;
        perPage: number;
      }>(withQuery('/suppliers', query));
    },
    /** Datos comerciales y de contacto de un proveedor. */
    getSupplierProfile(id: string) {
      return request<SupplierProfile>(`/suppliers/${encodeURIComponent(id)}`);
    },
    /** Historial de órdenes emitidas a un proveedor. */
    getSupplierHistory(id: string) {
      return request<SupplierOrderHistory>(`/suppliers/${encodeURIComponent(id)}/orders`);
    },
    /** Actualiza condiciones o datos del perfil de proveedor. */
    updateSupplierProfile(id: string, payload: unknown) {
      return request<SupplierProfile>(`/suppliers/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
  };
}
