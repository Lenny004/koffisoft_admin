import type { RequestEvent } from '@sveltejs/kit';

import { apiErrorMessage, apiRequest, readJson } from './api';
import type { EmployeePage, EmployeeRow, RoleRow, UserPage, UserRow } from '$lib/users/types';

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

function withQuery(path: string, values: Record<string, QueryValue>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function createUsersClient(event: RequestEvent, apiBaseUrl: string) {
  async function request<T>(
    path: string,
    options: { method?: string; json?: unknown } = {},
  ): Promise<T> {
    const response = await apiRequest(event, path, apiBaseUrl, options);
    if (!response.ok) throw new UsersApiError(response.status, await apiErrorMessage(response));
    return (await readJson<T>(response)) as T;
  }

  return {
    listUsers(query: {
      page?: number;
      pageSize?: number;
      search?: string;
      status?: string;
      role?: string;
    }) {
      return request<UserPage>(withQuery('/users/admin', query));
    },
    getUser(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}`);
    },
    createUser(payload: unknown) {
      return request<UserRow>('/users/admin', { method: 'POST', json: payload });
    },
    updateUser(id: string, payload: unknown) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    activateUser(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/activate`, {
        method: 'POST',
      });
    },
    deactivateUser(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/deactivate`, {
        method: 'POST',
      });
    },
    blockUser(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/block`, {
        method: 'POST',
      });
    },
    assignRoles(id: string, roleIds: string[]) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/roles`, {
        method: 'PUT',
        json: { roleIds },
      });
    },
    resetMfa(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/reset-mfa`, {
        method: 'POST',
      });
    },
    forcePasswordChange(id: string) {
      return request<UserRow>(`/users/admin/${encodeURIComponent(id)}/force-password-change`, {
        method: 'POST',
      });
    },
    listRoles(query: { businessId?: string; includeInactive?: boolean } = {}) {
      return request<RoleRow[]>(withQuery('/users/admin/roles', query));
    },
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
    getEmployee(id: string) {
      return request<EmployeeRow>(`/employees/admin/${encodeURIComponent(id)}`);
    },
    createEmployee(payload: unknown) {
      return request<EmployeeRow>('/employees/admin', { method: 'POST', json: payload });
    },
    updateEmployee(id: string, payload: unknown) {
      return request<EmployeeRow>(`/employees/admin/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        json: payload,
      });
    },
    removeEmployee(id: string) {
      return request<EmployeeRow>(`/employees/admin/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    },
  };
}
