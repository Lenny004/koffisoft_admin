import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type {
  MenuAllergen,
  MenuAvailability,
  MenuCategory,
  MenuItem,
  MenuPageMeta,
  MenuPrice,
  MenuVariant,
  MenuVariantAllergen,
} from '$lib/menu/types';

interface PageResponse<T> {
  data: T[];
  meta: MenuPageMeta;
}

export class MenuApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'MenuApiError';
  }
}

type QueryValue = string | number | boolean | undefined;

function queryString(values: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  return query.toString();
}

function withQuery(path: string, values: Record<string, QueryValue>): string {
  const query = queryString(values);
  return query ? `${path}?${query}` : path;
}

export function createMenuClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(path: string, options: { method?: string; json?: unknown } = {}) {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new MenuApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    listCategories(query: {
      locationId: string;
      page?: number;
      pageSize?: number;
      search?: string;
      includeInactive?: boolean;
    }) {
      return request<PageResponse<MenuCategory>>(withQuery('/menu/admin/categories', query));
    },
    createCategory(payload: unknown) {
      return request<MenuCategory>('/menu/admin/categories', { method: 'POST', json: payload });
    },
    updateCategory(id: string, locationId: string, payload: unknown) {
      return request<MenuCategory>(
        withQuery(`/menu/admin/categories/${encodeURIComponent(id)}`, { locationId }),
        { method: 'PATCH', json: payload },
      );
    },
    deleteCategory(id: string, locationId: string) {
      return request<MenuCategory>(
        withQuery(`/menu/admin/categories/${encodeURIComponent(id)}`, { locationId }),
        { method: 'DELETE' },
      );
    },
    reorderCategories(locationId: string, categories: unknown) {
      return request<MenuCategory[]>(withQuery('/menu/admin/categories/reorder', { locationId }), {
        method: 'POST',
        json: { categories },
      });
    },
    listItems(query: {
      locationId: string;
      page?: number;
      pageSize?: number;
      search?: string;
      includeInactive?: boolean;
    }) {
      return request<PageResponse<MenuItem>>(withQuery('/menu/admin/items', query));
    },
    getItem(id: string) {
      return request<MenuItem>(`/menu/admin/items/${encodeURIComponent(id)}`);
    },
    createItem(payload: unknown) {
      return request<MenuItem>('/menu/admin/items', { method: 'POST', json: payload });
    },
    updateItem(id: string, payload: unknown) {
      return request<MenuItem>(`/menu/admin/items/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    deleteItem(id: string) {
      return request<MenuItem>(`/menu/admin/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
    listVariants(
      itemId: string,
      query: { page?: number; pageSize?: number; search?: string; includeInactive?: boolean } = {},
    ) {
      return request<PageResponse<MenuVariant>>(
        withQuery(`/menu/admin/items/${encodeURIComponent(itemId)}/variants`, query),
      );
    },
    listPrices(
      variantId: string,
      query: { page?: number; pageSize?: number; includeInactive?: boolean } = {},
    ) {
      return request<PageResponse<MenuPrice>>(
        withQuery(`/menu/admin/variants/${encodeURIComponent(variantId)}/prices`, query),
      );
    },
    createPrice(variantId: string, payload: unknown) {
      return request<MenuPrice>(`/menu/admin/variants/${encodeURIComponent(variantId)}/prices`, {
        method: 'POST',
        json: payload,
      });
    },
    updatePrice(id: string, payload: unknown) {
      return request<MenuPrice>(`/menu/admin/prices/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    deletePrice(id: string) {
      return request<MenuPrice>(`/menu/admin/prices/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    listAllergens(
      query: { page?: number; pageSize?: number; search?: string; includeInactive?: boolean } = {},
    ) {
      return request<PageResponse<MenuAllergen>>(withQuery('/menu/admin/allergens', query));
    },
    listVariantAllergens(variantId: string) {
      return request<MenuVariantAllergen[]>(
        `/menu/admin/variants/${encodeURIComponent(variantId)}/allergens`,
      );
    },
    replaceVariantAllergens(variantId: string, allergens: unknown) {
      return request<MenuVariantAllergen[]>(
        `/menu/admin/variants/${encodeURIComponent(variantId)}/allergens`,
        { method: 'PUT', json: { allergens } },
      );
    },
    listAvailability(
      variantId: string,
      query: { page?: number; pageSize?: number; includeInactive?: boolean } = {},
    ) {
      return request<PageResponse<MenuAvailability>>(
        withQuery(`/menu/admin/variants/${encodeURIComponent(variantId)}/availability`, query),
      );
    },
    createAvailability(variantId: string, payload: unknown) {
      return request<MenuAvailability>(
        `/menu/admin/variants/${encodeURIComponent(variantId)}/availability`,
        { method: 'POST', json: payload },
      );
    },
    updateAvailability(id: string, payload: unknown) {
      return request<MenuAvailability>(`/menu/admin/availability/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    deleteAvailability(id: string) {
      return request<MenuAvailability>(`/menu/admin/availability/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };
}
