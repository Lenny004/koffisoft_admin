import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { createUsersClient, UsersApiError } from '$lib/server/users';
import { formBoolean, formText } from '$lib/validation/menu';
import {
  assignRolesSchema,
  createUserSchema,
  userActionSchema,
  userFilterSchema,
  updateUserSchema,
} from '$lib/validation/users';
import { formValues, validationErrors } from '$lib/validation/errors';
import type { PageMeta, RoleRow } from '$lib/users/types';

const PAGE_SIZE = 20;
const emptyMeta: PageMeta = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };

function configurationError(): string {
  return 'No se pudieron cargar los usuarios: configura API_BASE_URL para conectar el panel con la API.';
}

function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof UsersApiError) return { status: error.status, errors: [error.message] };
  return { status: 502, errors: ['La API de usuarios no está disponible en este momento.'] };
}

function parseRoleIds(formData: FormData): string[] {
  return formData
    .getAll('roleIds')
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
}

function userFields(formData: FormData) {
  return {
    id: formText(formData.get('id')),
    username: formText(formData.get('username')),
    email: formText(formData.get('email')),
    password: formText(formData.get('password')),
    confirmPassword: formText(formData.get('confirmPassword')),
    employeeId: formText(formData.get('employeeId')),
    roleIds: parseRoleIds(formData),
    mustChangePassword: formBoolean(formData.get('mustChangePassword')),
  };
}

export const load: PageServerLoad = async (event) => {
  const parsedFilters = userFilterSchema.safeParse({
    page: event.url.searchParams.get('page') ?? '1',
    search: event.url.searchParams.get('search') ?? '',
    status: event.url.searchParams.get('status') ?? '',
    role: event.url.searchParams.get('role') ?? '',
  });
  const filters = parsedFilters.success
    ? parsedFilters.data
    : { page: 1, search: '', status: '' as const, role: '' };
  const permissions = event.locals.permissions;

  if (!env.API_BASE_URL) {
    return {
      users: [],
      employeeOptions: [],
      roles: [],
      meta: emptyMeta,
      filters,
      permissions,
      error: configurationError(),
    };
  }

  try {
    const client = createUsersClient(event, env.API_BASE_URL);
    const [users, employeeOptions, roles] = await Promise.all([
      client.listUsers({ ...filters, pageSize: PAGE_SIZE }),
      client.listEmployees({
        page: 1,
        pageSize: 100,
        locationId: env.DEFAULT_LOCATION_ID ?? undefined,
      }),
      permissions.includes('roles.read')
        ? client.listRoles({ includeInactive: false })
        : Promise.resolve([] as RoleRow[]),
    ]);
    return {
      users: users.data,
      employeeOptions: employeeOptions.data,
      roles,
      meta: users.meta,
      filters,
      permissions,
      error: undefined,
    };
  } catch (error) {
    return {
      users: [],
      employeeOptions: [],
      roles: [],
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
        errors: ['No tienes permiso para administrar usuarios.'],
      });

    const formData = await event.request.formData();
    const values = userFields(formData);
    const id = values.id;
    try {
      const client = createUsersClient(event, env.API_BASE_URL ?? '');
      if (id) {
        const result = updateUserSchema.safeParse(values);
        if (!result.success)
          return fail(400, {
            action: 'save',
            errors: validationErrors(result.error),
            values: formValues(formData),
          });
        await client.updateUser(result.data.id, {
          username: result.data.username,
          email: result.data.email,
          employeeId: result.data.employeeId,
        });
      } else {
        const result = createUserSchema.safeParse(values);
        if (!result.success)
          return fail(400, {
            action: 'save',
            errors: validationErrors(result.error),
            values: formValues(formData),
          });
        if (result.data.roleIds.length > 0 && !event.locals.permissions.includes('roles.manage'))
          return fail(403, {
            action: 'save',
            errors: ['No tienes permiso para asignar roles durante el alta.'],
            values: formValues(formData),
          });
        await client.createUser({
          username: result.data.username,
          email: result.data.email,
          password: result.data.password,
          employeeId: result.data.employeeId,
          roleIds: result.data.roleIds,
          mustChangePassword: result.data.mustChangePassword,
        });
      }
      return { success: true, action: 'save' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'save', errors: response.errors });
    }
  },
  status: async (event) => {
    if (!event.locals.permissions.includes('users.manage'))
      return fail(403, { action: 'status', errors: ['No tienes permiso para cambiar estados.'] });
    const formData = await event.request.formData();
    const result = userActionSchema.safeParse({
      id: formText(formData.get('id')),
      action: formText(formData.get('action')),
    });
    if (!result.success)
      return fail(400, { action: 'status', errors: validationErrors(result.error) });
    try {
      const client = createUsersClient(event, env.API_BASE_URL ?? '');
      if (result.data.action === 'activate') await client.activateUser(result.data.id);
      if (result.data.action === 'deactivate') await client.deactivateUser(result.data.id);
      if (result.data.action === 'block') await client.blockUser(result.data.id);
      return { success: true, action: 'status' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'status', errors: response.errors });
    }
  },
  roles: async (event) => {
    if (!event.locals.permissions.includes('roles.manage'))
      return fail(403, { action: 'roles', errors: ['No tienes permiso para asignar roles.'] });
    const formData = await event.request.formData();
    const result = assignRolesSchema.safeParse({
      id: formText(formData.get('id')),
      roleIds: parseRoleIds(formData),
    });
    if (!result.success)
      return fail(400, { action: 'roles', errors: validationErrors(result.error) });
    try {
      await createUsersClient(event, env.API_BASE_URL ?? '').assignRoles(
        result.data.id,
        result.data.roleIds,
      );
      return { success: true, action: 'roles' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'roles', errors: response.errors });
    }
  },
  resetMfa: async (event) => {
    if (!event.locals.permissions.includes('users.manage'))
      return fail(403, { action: 'resetMfa', errors: ['No tienes permiso para restablecer MFA.'] });
    const id = formText((await event.request.formData()).get('id'));
    const result = userActionSchema.shape.id.safeParse(id);
    if (!result.success)
      return fail(400, { action: 'resetMfa', errors: ['El usuario no es válido.'] });
    try {
      await createUsersClient(event, env.API_BASE_URL ?? '').resetMfa(result.data);
      return { success: true, action: 'resetMfa' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'resetMfa', errors: response.errors });
    }
  },
  forcePasswordChange: async (event) => {
    if (!event.locals.permissions.includes('users.manage'))
      return fail(403, {
        action: 'forcePasswordChange',
        errors: ['No tienes permiso para forzar el cambio de contraseña.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    const result = userActionSchema.shape.id.safeParse(id);
    if (!result.success)
      return fail(400, { action: 'forcePasswordChange', errors: ['El usuario no es válido.'] });
    try {
      await createUsersClient(event, env.API_BASE_URL ?? '').forcePasswordChange(result.data);
      return { success: true, action: 'forcePasswordChange' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'forcePasswordChange', errors: response.errors });
    }
  },
};
