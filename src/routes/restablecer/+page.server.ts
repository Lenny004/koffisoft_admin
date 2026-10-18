import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import {
  actionErrorStatus,
  apiErrorMessage,
  apiRequest,
  connectionErrorMessage,
} from '$lib/server/api';
import { resetPasswordSchema } from '$lib/validation/auth';
import { validationErrors } from '$lib/validation/errors';

export const load: PageServerLoad = ({ url }) => ({
  token: url.searchParams.get('token') ?? '',
});

export const actions: Actions = {
  default: async (event) => {
    const submitted = await event.request.formData();
    const result = resetPasswordSchema.safeParse({
      token: submitted.get('token'),
      newPassword: submitted.get('newPassword'),
      confirmPassword: submitted.get('confirmPassword'),
    });
    if (!result.success) {
      return fail(400, {
        errors: validationErrors(result.error),
        token: String(submitted.get('token') ?? ''),
      });
    }

    let response: Response;
    try {
      response = await apiRequest(event, '/auth/reset-password', env.API_BASE_URL ?? '', {
        method: 'POST',
        json: {
          token: result.data.token,
          newPassword: result.data.newPassword,
        },
      });
    } catch (error) {
      return fail(502, {
        errors: [connectionErrorMessage(error)],
        token: result.data.token,
      });
    }

    if (!response.ok) {
      return fail(actionErrorStatus(response.status), {
        errors: [await apiErrorMessage(response)],
        token: result.data.token,
      });
    }

    return { success: true };
  },
};
