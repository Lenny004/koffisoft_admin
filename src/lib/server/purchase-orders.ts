import type { RequestEvent } from '@sveltejs/kit';

import type {
  PurchaseOrder,
  PurchaseOrderPage,
  SupplierOrderHistory,
  SupplierProfile,
} from '$lib/purchase-orders/types';
import { apiErrorMessage, apiRequest, readJson } from './api';
import { withQuery, type QueryValue } from './query';

export class PurchaseOrdersApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PurchaseOrdersApiError';
  }
}

export function createPurchaseOrdersClient(event: RequestEvent, apiBaseUrl: string) {
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
    listOrders(query: Record<string, QueryValue>) {
      return request<PurchaseOrderPage>(withQuery('/purchase-orders', query));
    },
    getOrder(id: string) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}`);
    },
    createOrder(payload: unknown) {
      return request<PurchaseOrder>('/purchase-orders', { method: 'POST', json: payload });
    },
    updateOrder(id: string, payload: unknown) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    submitOrder(id: string) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}/submit`, {
        method: 'POST',
      });
    },
    approveOrder(id: string) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}/approve`, {
        method: 'POST',
      });
    },
    cancelOrder(id: string) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}/cancel`, {
        method: 'POST',
      });
    },
    receiveOrder(id: string, payload: unknown) {
      return request<PurchaseOrder>(`/purchase-orders/${encodeURIComponent(id)}/receive`, {
        method: 'POST',
        json: payload,
      });
    },
    listSupplierProfiles(query: Record<string, QueryValue>) {
      return request<{
        data: SupplierProfile[];
        total: number;
        page: number;
        perPage: number;
      }>(withQuery('/suppliers', query));
    },
    getSupplierProfile(id: string) {
      return request<SupplierProfile>(`/suppliers/${encodeURIComponent(id)}`);
    },
    getSupplierHistory(id: string) {
      return request<SupplierOrderHistory>(`/suppliers/${encodeURIComponent(id)}/orders`);
    },
    updateSupplierProfile(id: string, payload: unknown) {
      return request<SupplierProfile>(`/suppliers/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
  };
}
