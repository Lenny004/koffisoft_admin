import type { RequestEvent } from '@sveltejs/kit';

import type {
  MaintenancePage,
  MaintenanceSchedule,
  ResourceItem,
  ResourcePage,
} from '$lib/resources/types';
import { apiErrorMessage, apiRequest, readJson } from './api';
import { withQuery, type QueryValue } from './query';

/** Error al gestionar inventario de recursos físicos o mantenimientos. */
export class ResourcesApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ResourcesApiError';
  }
}

/** Cliente BFF de recursos y mantenimientos programados. */
export function createResourcesClient(event: RequestEvent, apiBaseUrl: string) {
  /** Proxy autenticado hacia rutas `/resources/admin`. */
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new ResourcesApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Catálogo paginado de recursos por sede y filtros. */
    list(query: Record<string, QueryValue>) {
      return request<ResourcePage>(withQuery('/resources/admin', query));
    },
    /** Detalle de un recurso en el contexto de una sede. */
    get(id: string, locationId: string) {
      return request<ResourceItem>(
        withQuery(`/resources/admin/${encodeURIComponent(id)}`, { locationId }),
      );
    },
    /** Alta de un recurso en inventario. */
    create(payload: unknown) {
      return request<ResourceItem>('/resources/admin', { method: 'POST', json: payload });
    },
    /** Actualiza datos operativos del recurso. */
    update(id: string, locationId: string, payload: unknown) {
      return request<ResourceItem>(
        withQuery(`/resources/admin/${encodeURIComponent(id)}`, { locationId }),
        { method: 'PATCH', json: payload },
      );
    },
    /** Mantenimientos globales filtrados por sede, fechas o estado. */
    listMaintenances(query: Record<string, QueryValue>) {
      return request<MaintenancePage>(withQuery('/resources/admin/maintenance', query));
    },
    /** Historial de mantenimientos de un recurso concreto. */
    listResourceMaintenances(id: string, query: Record<string, QueryValue>) {
      return request<MaintenancePage>(
        withQuery(`/resources/admin/${encodeURIComponent(id)}/maintenance`, query),
      );
    },
    /** Programa un nuevo mantenimiento. */
    scheduleMaintenance(payload: unknown) {
      return request<MaintenanceSchedule>('/resources/admin/maintenance', {
        method: 'POST',
        json: payload,
      });
    },
    /** Cierra un mantenimiento registrando resultado o notas. */
    completeMaintenance(id: string, payload: unknown) {
      return request<MaintenanceSchedule>(
        `/resources/admin/maintenance/${encodeURIComponent(id)}/complete`,
        { method: 'PATCH', json: payload },
      );
    },
  };
}
