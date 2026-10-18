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

/** Respuesta paginada estándar de listados del menú. */
interface PageResponse<T> {
  data: T[];
  meta: MenuPageMeta;
}

/** Error al administrar categorías, ítems, precios o disponibilidad del menú. */
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

/** Serializa parámetros de consulta del menú. */
function queryString(values: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  return query.toString();
}

/** Combina path con query string cuando hay filtros. */
function withQuery(path: string, values: Record<string, QueryValue>): string {
  const query = queryString(values);
  return query ? `${path}?${query}` : path;
}

/** Cliente BFF del editor de carta, variantes y precios por sede. */
export function createMenuClient(event: RequestEvent, apiBaseUrl: string) {
  /** Proxy autenticado bajo `/menu/admin`. */
  async function request<T>(path: string, options: { method?: string; json?: unknown } = {}) {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new MenuApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Categorías de la carta paginadas por sede. */
    listCategories(query: {
      locationId: string;
      page?: number;
      pageSize?: number;
      search?: string;
      includeInactive?: boolean;
    }) {
      return request<PageResponse<MenuCategory>>(withQuery('/menu/admin/categories', query));
    },
    /** Crea una categoría en la sede. */
    createCategory(payload: unknown) {
      return request<MenuCategory>('/menu/admin/categories', { method: 'POST', json: payload });
    },
    /** Actualiza nombre, orden o visibilidad de la categoría. */
    updateCategory(id: string, locationId: string, payload: unknown) {
      return request<MenuCategory>(
        withQuery(`/menu/admin/categories/${encodeURIComponent(id)}`, { locationId }),
        { method: 'PATCH', json: payload },
      );
    },
    /** Elimina o desactiva la categoría en la sede. */
    deleteCategory(id: string, locationId: string) {
      return request<MenuCategory>(
        withQuery(`/menu/admin/categories/${encodeURIComponent(id)}`, { locationId }),
        { method: 'DELETE' },
      );
    },
    /** Persiste el orden visual de categorías tras drag-and-drop. */
    reorderCategories(locationId: string, categories: unknown) {
      return request<MenuCategory[]>(withQuery('/menu/admin/categories/reorder', { locationId }), {
        method: 'POST',
        json: { categories },
      });
    },
    /** Ítems de menú paginados con búsqueda. */
    listItems(query: {
      locationId: string;
      page?: number;
      pageSize?: number;
      search?: string;
      includeInactive?: boolean;
    }) {
      return request<PageResponse<MenuItem>>(withQuery('/menu/admin/items', query));
    },
    /** Detalle de un ítem con variantes asociadas. */
    getItem(id: string) {
      return request<MenuItem>(`/menu/admin/items/${encodeURIComponent(id)}`);
    },
    /** Alta de ítem base en la carta. */
    createItem(payload: unknown) {
      return request<MenuItem>('/menu/admin/items', { method: 'POST', json: payload });
    },
    /** Actualiza descripción, categoría o flags del ítem. */
    updateItem(id: string, payload: unknown) {
      return request<MenuItem>(`/menu/admin/items/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    /** Retira el ítem del menú publicado. */
    deleteItem(id: string) {
      return request<MenuItem>(`/menu/admin/items/${encodeURIComponent(id)}`, { method: 'DELETE' });
    },
    /** Variantes (tamaños, presentaciones) de un ítem. */
    listVariants(
      itemId: string,
      query: { page?: number; pageSize?: number; search?: string; includeInactive?: boolean } = {},
    ) {
      return request<PageResponse<MenuVariant>>(
        withQuery(`/menu/admin/items/${encodeURIComponent(itemId)}/variants`, query),
      );
    },
    /** Precios históricos o vigentes de una variante. */
    listPrices(
      variantId: string,
      query: { page?: number; pageSize?: number; includeInactive?: boolean } = {},
    ) {
      return request<PageResponse<MenuPrice>>(
        withQuery(`/menu/admin/variants/${encodeURIComponent(variantId)}/prices`, query),
      );
    },
    /** Añade un precio con vigencia a la variante. */
    createPrice(variantId: string, payload: unknown) {
      return request<MenuPrice>(`/menu/admin/variants/${encodeURIComponent(variantId)}/prices`, {
        method: 'POST',
        json: payload,
      });
    },
    /** Modifica monto o periodo de un precio existente. */
    updatePrice(id: string, payload: unknown) {
      return request<MenuPrice>(`/menu/admin/prices/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    /** Elimina un precio que ya no debe aplicarse. */
    deletePrice(id: string) {
      return request<MenuPrice>(`/menu/admin/prices/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
    /** Catálogo maestro de alérgenos declarables. */
    listAllergens(
      query: { page?: number; pageSize?: number; search?: string; includeInactive?: boolean } = {},
    ) {
      return request<PageResponse<MenuAllergen>>(withQuery('/menu/admin/allergens', query));
    },
    /** Alérgenos vinculados a una variante concreta. */
    listVariantAllergens(variantId: string) {
      return request<MenuVariantAllergen[]>(
        `/menu/admin/variants/${encodeURIComponent(variantId)}/allergens`,
      );
    },
    /** Sustituye por completo la lista de alérgenos de la variante. */
    replaceVariantAllergens(variantId: string, allergens: unknown) {
      return request<MenuVariantAllergen[]>(
        `/menu/admin/variants/${encodeURIComponent(variantId)}/allergens`,
        { method: 'PUT', json: { allergens } },
      );
    },
    /** Ventanas de disponibilidad (días/horas) de la variante. */
    listAvailability(
      variantId: string,
      query: { page?: number; pageSize?: number; includeInactive?: boolean } = {},
    ) {
      return request<PageResponse<MenuAvailability>>(
        withQuery(`/menu/admin/variants/${encodeURIComponent(variantId)}/availability`, query),
      );
    },
    /** Define una regla de disponibilidad nueva. */
    createAvailability(variantId: string, payload: unknown) {
      return request<MenuAvailability>(
        `/menu/admin/variants/${encodeURIComponent(variantId)}/availability`,
        { method: 'POST', json: payload },
      );
    },
    /** Ajusta días u horarios de una regla existente. */
    updateAvailability(id: string, payload: unknown) {
      return request<MenuAvailability>(`/menu/admin/availability/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    /** Elimina una regla de disponibilidad. */
    deleteAvailability(id: string) {
      return request<MenuAvailability>(`/menu/admin/availability/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };
}
