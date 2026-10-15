import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { createBackupClient, BackupApiError } from '$lib/server/backups';
import { formText } from '$lib/validation/menu';
import { formValues, validationErrors } from '$lib/validation/errors';
import { backupCreateSchema, backupDeleteSchema } from '$lib/validation/backups';

function configurationError(): string {
  return 'No se pudieron cargar los respaldos: configura API_BASE_URL.';
}

function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof BackupApiError) return { status: error.status, errors: [error.message] };
  return { status: 502, errors: ['La API de respaldos no está disponible en este momento.'] };
}

export const load: PageServerLoad = async (event) => {
  const permissions = event.locals.permissions;
  const baseData = {
    backups: [],
    permissions,
    error: undefined as string | undefined,
  };

  if (!permissions.includes('backups.read')) {
    return {
      ...baseData,
      error: 'No tienes permiso para consultar los respaldos.',
    };
  }
  if (!env.API_BASE_URL) return { ...baseData, error: configurationError() };

  try {
    const backups = await createBackupClient(event, env.API_BASE_URL).list();
    return { ...baseData, backups, error: undefined };
  } catch (error) {
    return {
      ...baseData,
      error: error instanceof BackupApiError ? error.message : configurationError(),
    };
  }
};

export const actions: Actions = {
  create: async (event) => {
    if (!event.locals.permissions.includes('backups.create')) {
      return fail(403, { action: 'create', errors: ['No tienes permiso para generar respaldos.'] });
    }
    const formData = await event.request.formData();
    const result = backupCreateSchema.safeParse({ type: formText(formData.get('type')) });
    if (!result.success) {
      return fail(400, {
        action: 'create',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    }
    if (!env.API_BASE_URL) return fail(503, { action: 'create', errors: [configurationError()] });

    try {
      await createBackupClient(event, env.API_BASE_URL).create(result.data.type);
      return { success: true, action: 'create' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'create', errors: response.errors });
    }
  },
  delete: async (event) => {
    if (!event.locals.permissions.includes('backups.delete')) {
      return fail(403, {
        action: 'delete',
        errors: ['No tienes permiso para eliminar respaldos.'],
      });
    }
    const formData = await event.request.formData();
    const result = backupDeleteSchema.safeParse({ id: formText(formData.get('id')) });
    if (!result.success) {
      return fail(400, {
        action: 'delete',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    }
    if (!env.API_BASE_URL) return fail(503, { action: 'delete', errors: [configurationError()] });

    try {
      await createBackupClient(event, env.API_BASE_URL).delete(result.data.id);
      return { success: true, action: 'delete' };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'delete', errors: response.errors });
    }
  },
};
