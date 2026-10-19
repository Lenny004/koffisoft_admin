/**
 * Servidor de perfil: expone el usuario en sesión y la action de cambio de contraseña propia.
 */
import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import {
  actionErrorStatus,
  apiErrorMessage,
  apiRequest,
  connectionErrorMessage,
  forwardSessionCookies,
} from '$lib/server/api';
import { changePasswordSchema } from '$lib/validation/auth';
import { formValues, validationErrors } from '$lib/validation/errors';

/** Expone al usuario autenticado ya resuelto en locals para la vista de perfil. */
export const load: PageServerLoad = ({ locals }) => ({ user: locals.user });

/** Permite cambiar contraseña propia vía /auth/password reenviando cookies de sesión. */
export const actions: Actions = {
  /** Valida y aplica nueva contraseña del usuario en sesión. */
  changePassword: async (event) => {
    const formData = await event.request.formData();
    const values = Object.fromEntries(formData);
    const result = changePasswordSchema.safeParse(values);
    if (!result.success)
      return fail(400, { errors: validationErrors(result.error), values: formValues(formData) });

    let response: Response;
    try {
      response = await apiRequest(event, '/auth/password', env.API_BASE_URL ?? '', {
        method: 'POST',
        json: {
          currentPassword: result.data.currentPassword,
          newPassword: result.data.newPassword,
        },
      });
      forwardSessionCookies(
        event,
        response,
        event.url.protocol === 'https:' || env.COOKIE_SECURE === 'true',
      );
    } catch (error) {
      return fail(502, { errors: [connectionErrorMessage(error)] });
    }
    if (!response.ok)
      return fail(actionErrorStatus(response.status), {
        errors: [await apiErrorMessage(response)],
      });
    return { success: true };
  },
};
