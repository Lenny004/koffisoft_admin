import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { apiErrorMessage, apiRequest, forwardSessionCookies } from '$lib/server/api';
import { changePasswordSchema } from '$lib/validation/auth';
import { formValues, validationErrors } from '$lib/validation/errors';

export const load: PageServerLoad = ({ locals }) => ({ user: locals.user });

export const actions: Actions = {
  changePassword: async (event) => {
    const formData = await event.request.formData();
    const values = Object.fromEntries(formData);
    const result = changePasswordSchema.safeParse(values);
    if (!result.success)
      return fail(400, { errors: validationErrors(result.error), values: formValues(formData) });

    const response = await apiRequest(event, '/auth/password', env.API_BASE_URL ?? '', {
      method: 'POST',
      json: { currentPassword: result.data.currentPassword, newPassword: result.data.newPassword },
    });
    forwardSessionCookies(
      event,
      response,
      event.url.protocol === 'https:' || env.COOKIE_SECURE === 'true',
    );
    if (!response.ok) return fail(response.status, { errors: [await apiErrorMessage(response)] });
    return { success: true };
  },
};
