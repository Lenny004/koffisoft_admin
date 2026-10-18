import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type { EmployeePage, EmployeeRow, RoleRow, UserPage, UserRow } from '$lib/users/types';

/** Error al administrar usuarios, roles o empleados en la API. */
export class UsersApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'UsersApiError';
  }
}

type QueryValue = string | number | boolean | undefined;

/** Construye query string para listados administrativos de usuarios. */
function withQuery(path: string, values: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

/** Cliente BFF de identidad: usuarios del panel, roles y nómina operativa. */
export function createUsersClient(event: RequestEvent, apiBaseUrl: string) {
  /** Proxy autenticado hacia `/users/admin` y `/employees/admin`. */
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new UsersApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    /** Usuarios del panel paginados con búsqueda y filtros de rol o estado. */
    listUsers(query: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
      role?: string;
    }) {
      return request<UserPage>(withQuery('/users/admin', query));
    },
    /** Perfil completo de un usuario administrativo. */
    getUser(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}`);
    },
    /** Alta de usuario con credenciales iniciales. */
    createUser(payload: unknown) {
      return request<UserRow>('/users/admin', { method: 'POST', json: payload });
    },
    /** Actualiza datos de contacto, nombre o preferencias. */
    updateUser(id: string, payload: unknown) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    /** Reactiva una cuenta suspendida. */
    activateUser(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/activate`, {
        method: 'POST',
      });
    },
    /** Desactiva acceso sin borrar historial. */
    deactivateUser(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/deactivate`, {
        method: 'POST',
      });
    },
    /** Bloqueo por seguridad hasta intervención manual. */
    blockUser(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/block`, {
        method: 'POST',
      });
    },
    /** Reemplaza el conjunto de roles RBAC del usuario. */
    assignRoles(id: string, roleIds: string[]) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/roles`, {
        method: 'PUT',
        json: { roleIds },
      });
    },
    /** Invalida factores MFA registrados. */
    resetMfa(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/reset-mfa`, {
        method: 'POST',
      });
    },
    /** Obliga cambio de contraseña en el próximo inicio de sesión. */
    forcePasswordChange(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/force-password-change`, {
        method: 'POST',
      });
    },
    /** Catálogo de roles disponibles para asignación. */
    listRoles(query: { businessId?: string; includeInactive?: boolean } = {}) {
      return request<RoleRow[]>(withQuery('/users/admin/roles', query));
    },
    /** Empleados operativos paginados por sede u ocupación. */
    listEmployees(query: {
      page?: number;
      pageSize?: number;
      locationId?: string;
      search?: string;
      status?: string;
      jobCode?: string;
    }) {
      return request<EmployeePage>(withQuery('/employees/admin', query));
    },
    /** Ficha de un empleado vinculado al negocio. */
    getEmployee(id: string) {
      return request<EmployeeRow>(`/employees/admin/${encodeURIComponent(id)}`);
    },
    /** Alta de empleado con datos laborales. */
    createEmployee(payload: unknown) {
      return request<EmployeeRow>('/employees/admin', { method: 'POST', json: payload });
    },
    /** Actualiza puesto, sede o estado del empleado. */
    updateEmployee(id: string, payload: unknown) {
      return request<EmployeeRow>(`/employees/admin/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    /** Baja lógica o eliminación del registro de empleado. */
    removeEmployee(id: string) {
      return request<EmployeeRow>(`/employees/admin/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };
}
