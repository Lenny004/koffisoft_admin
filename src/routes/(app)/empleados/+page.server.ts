import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { createUsersClient, UsersApiError } from '$lib/server/users';
import { formText } from '$lib/validation/menu';
import { formValues, validationErrors } from '$lib/validation/errors';
import {
  createEmployeeSchema,
  employeeFilterSchema,
  updateEmployeeSchema,
} from '$lib/validation/users';
import type { PageMeta } from '$lib/users/types';

const PAGE_SIZE = 20;
const emptyMeta: PageMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };

function configurationError(): string {
  return 'No se pudieron cargar los empleados: configura API_BASE_URL y DEFAULT_LOCATION_ID.';
}

function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof UsersApiError) return { status: error.status, errors: [error.message] };
  return { status: 502, errors: ['La API de empleados no está disponible en este momento.'] };
}

function employeeFields(formData: FormData) {
  return {
    id: formText(formData.get('id')),
    locationId: formText(formData.get('locationId')),
    employeeCode: formText(formData.get('employeeCode')),
    firstName: formText(formData.get('firstName')),
    lastName: formText(formData.get('lastName')),
    jobCode: formText(formData.get('jobCode')),
    hireDate: formText(formData.get('hireDate')),
    terminationDate: formText(formData.get('terminationDate')),
    status: formText(formData.get('status')),
    phone: formText(formData.get('phone')),
    email: formText(formData.get('email')),
    userId: formText(formData.get('userId')),
  };
}

export const load: PageServerLoad = async (event) => {
  const parsedFilters = employeeFilterSchema.safeParse({
    page: event.url.searchParams.get('page') ?? '1',
    search: event.url.searchParams.get('search') ?? '',
    status: event.url.searchParams.get('status') ?? '',
    jobCode: event.url.searchParams.get('jobCode') ?? '',
  });
  const filters = parsedFilters.success
    ? parsedFilters.data
    : { page: 1, search: '', status: '' as const, jobCode: '' as const };
  const permissions = event.locals.permissions;
  const locationId = env.DEFAULT_LOCATION_ID ?? '';

  if (!env.API_BASE_URL || !locationId) {
    return {
      employees: [],
      userOptions: [],
      locationId,
      meta: emptyMeta,
      filters,
      permissions,
      error: configurationError(),
    };
  }

  try {
    const client = createUsersClient(event, env.API_BASE_URL);
    const [employees, users] = await Promise.all([
      client.listEmployees({ ...filters, pageSize: PAGE_SIZE, locationId }),
      client.listUsers({ page: 1, pageSize: 100, status: 'active' }),
    ]);
    return {
      employees: employees.data,
      userOptions: users.data,
      locationId,
      meta: employees.meta,
      filters,
      permissions,
      error: undefined,
    };
  } catch (error) {
    return {
      employees: [],
      userOptions: [],
      locationId,
      meta: { ...emptyMeta, page: filters.page },
      filters,
      permissions,
      error: error instanceof UsersApiError ? error.message : configurationError(),
    };
  }
};

export const actions: Actions = {
  save: async (event) => {
    if (!event.locals.permissions.includes('users.manage'))
      return fail(403, {
        action: 'save',
        errors: ['No tienes permiso para administrar empleados.'],
      });
    const formData = await event.request.formData();
    const values = employeeFields(formData);
    try {
      const client = createUsersClient(event, env.API_BASE_URL ?? '');
      if (values.id) {
        const result = updateEmployeeSchema.safeParse(values);
        if (!result.success)
          return fail(400, {
            action: 'save',
            errors: validationErrors(result.error),
            values: formValues(formData),
          });
        await client.updateEmployee(result.data.id, {
          employeeCode: result.data.employeeCode,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          jobCode: result.data.jobCode,
          hireDate: result.data.hireDate,
          terminationDate: result.data.terminationDate || null,
          status: result.data.status,
          phone: result.data.phone || null,
          email: result.data.email || null,
          userId: result.data.userId,
        });
      } else {
        const result = createEmployeeSchema.safeParse(values);
        if (!result.success)
          return fail(400, {
            action: 'save',
            errors: validationErrors(result.error),
            values: formValues(formData),
          });
        await client.createEmployee({
          ...result.data,
          phone: result.data.phone || null,
          email: result.data.email || null,
          userId: result.data.userId,
        });
      }
      return { success: true, action: 'save' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'save', errors: response.errors });
    }
  },
  delete: async (event) => {
    if (!event.locals.permissions.includes('users.manage'))
      return fail(403, {
        action: 'delete',
        errors: ['No tienes permiso para desactivar empleados.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    const result = updateEmployeeSchema.shape.id.safeParse(id);
    if (!result.success)
      return fail(400, { action: 'delete', errors: ['El empleado no es válido.'] });
    try {
      await createUsersClient(event, env.API_BASE_URL ?? '').removeEmployee(result.data);
      return { success: true, action: 'delete' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'delete', errors: response.errors });
    }
  },
};
