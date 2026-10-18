import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type {
  AnalyticsLocation,
  AnalyticsPageRow,
  AnalyticsProductRow,
  AnalyticsReferrerRow,
  AnalyticsSummary,
} from '$lib/analytics/types';

/** Representa un fallo HTTP al consultar reportes de analytics en la API. */
export class AnalyticsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AnalyticsApiError';
  }
}

/** Construye la URL de un endpoint de analytics con sede y rango de fechas. */
function withRange(path: string, locationId: string, from: string, to: string): string {
  const query = new URLSearchParams({ locationId, from, to });
  return `${path}?${query.toString()}`;
}

/** Cliente BFF de reportes: reusa la sesión HttpOnly y el CSRF del cliente común. */
export function createAnalyticsClient(event: RequestEvent, apiBaseUrl: string) {
  /** Ejecuta GET autenticado y convierte respuestas no exitosas en `AnalyticsApiError`. */
  async function request<T>(path: string): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl);
    if (!response.ok) throw new AnalyticsApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Sedes administrables para acotar métricas. */
    listLocations() {
      return request<AnalyticsLocation[]>('/analytics/admin/locations');
    },
    /** Totales agregados del periodo seleccionado. */
    getSummary(locationId: string, from: string, to: string) {
      return request<AnalyticsSummary>(withRange('/analytics/admin/summary', locationId, from, to));
    },
    /** Páginas más visitadas en el rango. */
    getPages(locationId: string, from: string, to: string) {
      return request<AnalyticsPageRow[]>(withRange('/analytics/admin/pages', locationId, from, to));
    },
    /** Productos o ítems de menú con más interacción. */
    getProducts(locationId: string, from: string, to: string) {
      return request<AnalyticsProductRow[]>(
        withRange('/analytics/admin/products', locationId, from, to),
      );
    },
    /** Orígenes de tráfico (referrers) en el periodo. */
    getReferrers(locationId: string, from: string, to: string) {
      return request<AnalyticsReferrerRow[]>(
        withRange('/analytics/admin/referrers', locationId, from, to),
      );
    },
  };
}
