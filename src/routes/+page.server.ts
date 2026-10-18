import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import {
  actionErrorStatus,
  apiErrorMessage,
  apiRequest,
  clearSessionCookie,
  connectionErrorMessage,
  forwardSessionCookies,
  readJson,
} from '$lib/server/api';
import { needsPasswordChange, type AuthenticatedUser } from '$lib/types/auth';
import {
  changePasswordSchema,
  FORGOT_PASSWORD_MESSAGE,
  forgotPasswordSchema,
  initialSetupSchema,
  loginSchema,
  mfaSetupSchema,
  recoveryCodeSchema,
  totpSchema,
} from '$lib/validation/auth';
import { formValues } from '$lib/validation/errors';
import { validationErrors } from '$lib/validation/errors';
import { safeReturnTo } from '$lib/server/return-to';

/** Form actions del acceso: validan en servidor, llaman a auth y trasladan solo cookies seguras. */
interface LoginResponse {
  requiresMfa?: boolean;
  requiresMfaSetup?: boolean;
  requiresPasswordChange?: boolean;
  mustChangePassword?: boolean;
}

interface MfaSetupResponse {
  label: string;
  uri: string;
  status: string;
}

interface RecoveryCodesResponse {
  recoveryCodes: string[];
}

function secureCookie(event: RequestEvent): boolean {
  return event.url.protocol === 'https:' || env.COOKIE_SECURE === 'true';
}

function returnTo(event: RequestEvent, formData?: FormData): string {
  const submitted = formData?.get('returnTo');
  const requested =
    typeof submitted === 'string' ? submitted : event.url.searchParams.get('returnTo');
  return safeReturnTo(requested, event.url.origin);
}

async function authenticatedStep(event: RequestEvent): Promise<'password' | undefined> {
  try {
    if (!env.API_BASE_URL) return undefined;
    const response = await apiRequest(event, '/auth/me', env.API_BASE_URL);
    if (!response.ok) return undefined;
    const payload = (await readJson<{ user?: Record<string, unknown> }>(response)) ?? {};
    return needsPasswordChange(payload.user as AuthenticatedUser | undefined)
      ? 'password'
      : undefined;
  } catch {
    return undefined;
  }
}

export const load: PageServerLoad = async (event) => {
  let setupRequired = false;
  if (env.API_BASE_URL) {
    try {
      const response = await apiRequest(event, '/auth/setup', env.API_BASE_URL);
      if (response.ok) {
        const payload = await readJson<{ required?: boolean }>(response);
        setupRequired = payload?.required === true;
      }
    } catch {
      setupRequired = false;
    }
  }

  return {
    setupRequired,
    showForgot: event.url.searchParams.get('recuperar') === '1',
    returnTo: returnTo(event),
  };
};

export const actions: Actions = {
  bootstrap: async (event) => {
    const submitted = await event.request.formData();
    const values = Object.fromEntries(submitted);
    const result = initialSetupSchema.safeParse({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    });
    const safeValues = formValues(submitted);

    if (!result.success) {
      return fail(400, {
        action: 'bootstrap',
        step: 'bootstrap' as const,
        errors: validationErrors(result.error),
        values: safeValues,
        returnTo: returnTo(event, submitted),
      });
    }

    let response: Response;
    try {
      response = await apiRequest(event, '/auth/setup', env.API_BASE_URL ?? '', {
        method: 'POST',
        json: {
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          email: result.data.email,
          password: result.data.password,
        },
      });
      forwardSessionCookies(event, response, secureCookie(event));
    } catch (error) {
      return fail(502, {
        action: 'bootstrap',
        step: 'bootstrap' as const,
        errors: [connectionErrorMessage(error)],
        values: safeValues,
        returnTo: returnTo(event, submitted),
      });
    }

    if (!response.ok) {
      return fail(actionErrorStatus(response.status), {
        action: 'bootstrap',
        step: 'bootstrap' as const,
        errors: [await apiErrorMessage(response)],
        values: safeValues,
        returnTo: returnTo(event, submitted),
      });
    }

    const payload = (await readJson<LoginResponse>(response)) ?? {};
    const destination = returnTo(event, submitted);
    if (payload.requiresMfa)
      return { action: 'bootstrap', step: 'totp' as const, returnTo: destination };
    if (payload.requiresMfaSetup)
      return { action: 'bootstrap', step: 'setup' as const, returnTo: destination };
    redirect(303, destination);
  },

  login: async (event) => {
    const submitted = await event.request.formData();
    const values = Object.fromEntries(submitted);
    const result = loginSchema.safeParse({
      email: values.email,
      password: values.password,
    });

    if (!result.success) {
      return fail(400, {
        action: 'login',
        errors: validationErrors(result.error),
        values: { email: String(values.email ?? '') },
        returnTo: returnTo(event, submitted),
      });
    }

    let response: Response;
    try {
      response = await apiRequest(event, '/auth/login', env.API_BASE_URL ?? '', {
        method: 'POST',
        json: result.data,
      });
      forwardSessionCookies(event, response, secureCookie(event));
    } catch (error) {
      return fail(502, {
        action: 'login',
        errors: [connectionErrorMessage(error)],
        email: result.data.email,
        returnTo: returnTo(event, submitted),
      });
    }

    if (!response.ok) {
      return fail(actionErrorStatus(response.status), {
        action: 'login',
        errors: [await apiErrorMessage(response)],
        email: result.data.email,
        returnTo: returnTo(event, submitted),
      });
    }

    const payload = (await readJson<LoginResponse>(response)) ?? {};
    const destination = returnTo(event, submitted);
    if (payload.requiresMfa)
      return { action: 'login', step: 'totp' as const, returnTo: destination };
    if (payload.requiresMfaSetup)
      return { action: 'login', step: 'setup' as const, returnTo: destination };
    if (payload.requiresPasswordChange || payload.mustChangePassword) {
      return { action: 'login', step: 'password' as const, returnTo: destination };
    }

    redirect(303, destination);
  },

  verifyMfa: async (event) => {
    const submitted = await event.request.formData();
    const values = Object.fromEntries(submitted);
    const destination = returnTo(event, submitted);
    const result = totpSchema.safeParse({ code: values.code });
    if (!result.success)
      return fail(400, {
        action: 'verifyMfa',
        step: 'totp' as const,
        errors: validationErrors(result.error),
        returnTo: destination,
      });

    let response: Response;
    try {
      response = await apiRequest(event, '/auth/mfa/verify', env.API_BASE_URL ?? '', {
        method: 'POST',
        json: result.data,
      });
      forwardSessionCookies(event, response, secureCookie(event));
    } catch (error) {
      return fail(502, {
        action: 'verifyMfa',
        step: 'totp' as const,
        errors: [connectionErrorMessage(error)],
        returnTo: destination,
      });
    }
    if (!response.ok)
      return fail(actionErrorStatus(response.status), {
        action: 'verifyMfa',
        step: 'totp' as const,
        errors: [await apiErrorMessage(response)],
        returnTo: destination,
      });

    if (await authenticatedStep(event))
      return { action: 'verifyMfa', step: 'password' as const, returnTo: destination };
    redirect(303, destination);
  },

  recoverMfa: async (event) => {
    const submitted = await event.request.formData();
    const values = Object.fromEntries(submitted);
    const destination = returnTo(event, submitted);
    const result = recoveryCodeSchema.safeParse({ code: values.code });
    if (!result.success)
      return fail(400, {
        action: 'recoverMfa',
        step: 'recovery' as const,
        errors: validationErrors(result.error),
        returnTo: destination,
      });

    let response: Response;
    try {
      response = await apiRequest(event, '/auth/mfa/recovery', env.API_BASE_URL ?? '', {
        method: 'POST',
        json: result.data,
      });
      forwardSessionCookies(event, response, secureCookie(event));
    } catch (error) {
      return fail(502, {
        action: 'recoverMfa',
        step: 'recovery' as const,
        errors: [connectionErrorMessage(error)],
        returnTo: destination,
      });
    }
    if (!response.ok)
      return fail(actionErrorStatus(response.status), {
        action: 'recoverMfa',
        step: 'recovery' as const,
        errors: [await apiErrorMessage(response)],
        returnTo: destination,
      });
    redirect(303, destination);
  },

  setupMfa: async (event) => {
    const submitted = await event.request.formData();
    const values = Object.fromEntries(submitted);
    const destination = returnTo(event, submitted);
    const result = mfaSetupSchema.safeParse({ label: values.label || undefined });
    if (!result.success)
      return fail(400, {
        action: 'setupMfa',
        step: 'setup' as const,
        errors: validationErrors(result.error),
        values: { label: String(values.label ?? '') },
        returnTo: destination,
      });
    const label = result.data.label;
    let response: Response;
    try {
      response = await apiRequest(event, '/auth/mfa/totp/setup', env.API_BASE_URL ?? '', {
        method: 'POST',
        json: label ? { label } : {},
      });
    } catch (error) {
      return fail(502, {
        action: 'setupMfa',
        step: 'setup' as const,
        errors: [connectionErrorMessage(error)],
        values: { label },
        returnTo: destination,
      });
    }
    if (!response.ok)
      return fail(actionErrorStatus(response.status), {
        action: 'setupMfa',
        step: 'setup' as const,
        errors: [await apiErrorMessage(response)],
        returnTo: destination,
      });
    const payload = await readJson<MfaSetupResponse>(response);
    return {
      action: 'setupMfa',
      step: 'confirm' as const,
      uri: payload?.uri,
      label: payload?.label,
      returnTo: destination,
    };
  },

  confirmMfa: async (event) => {
    const submitted = await event.request.formData();
    const values = Object.fromEntries(submitted);
    const destination = returnTo(event, submitted);
    const result = totpSchema.safeParse({ code: values.code });
    if (!result.success)
      return fail(400, {
        action: 'confirmMfa',
        step: 'confirm' as const,
        errors: validationErrors(result.error),
        values: { uri: String(values.uri ?? '') },
        uri: values.uri,
        returnTo: destination,
      });

    let response: Response;
    try {
      response = await apiRequest(event, '/auth/mfa/totp/confirm', env.API_BASE_URL ?? '', {
        method: 'POST',
        json: result.data,
      });
      forwardSessionCookies(event, response, secureCookie(event));
    } catch (error) {
      return fail(502, {
        action: 'confirmMfa',
        step: 'confirm' as const,
        errors: [connectionErrorMessage(error)],
        values: { uri: String(values.uri ?? '') },
        uri: values.uri,
        returnTo: destination,
      });
    }
    if (!response.ok)
      return fail(actionErrorStatus(response.status), {
        action: 'confirmMfa',
        step: 'confirm' as const,
        errors: [await apiErrorMessage(response)],
        values: { uri: String(values.uri ?? '') },
        uri: values.uri,
        returnTo: destination,
      });
    const payload = await readJson<RecoveryCodesResponse>(response);
    return {
      action: 'confirmMfa',
      step: 'recovery' as const,
      recoveryCodes: payload?.recoveryCodes ?? [],
      returnTo: destination,
    };
  },

  changePassword: async (event) => {
    const submitted = await event.request.formData();
    const values = Object.fromEntries(submitted);
    const destination = returnTo(event, submitted);
    const result = changePasswordSchema.safeParse(values);
    if (!result.success)
      return fail(400, {
        action: 'changePassword',
        step: 'password' as const,
        errors: validationErrors(result.error),
        returnTo: destination,
      });

    let response: Response;
    try {
      response = await apiRequest(event, '/auth/password', env.API_BASE_URL ?? '', {
        method: 'POST',
        json: {
          currentPassword: result.data.currentPassword,
          newPassword: result.data.newPassword,
        },
      });
      forwardSessionCookies(event, response, secureCookie(event));
    } catch (error) {
      return fail(502, {
        action: 'changePassword',
        step: 'password' as const,
        errors: [connectionErrorMessage(error)],
        returnTo: destination,
      });
    }
    if (!response.ok)
      return fail(actionErrorStatus(response.status), {
        action: 'changePassword',
        step: 'password' as const,
        errors: [await apiErrorMessage(response)],
        returnTo: destination,
      });
    redirect(303, destination);
  },

  forgot: async (event) => {
    const submitted = await event.request.formData();
    const values = Object.fromEntries(submitted);
    const result = forgotPasswordSchema.safeParse({ email: values.email });
    const destination = returnTo(event, submitted);
    if (!result.success) {
      return fail(400, {
        action: 'forgot',
        step: 'forgot' as const,
        errors: validationErrors(result.error),
        values: { email: String(values.email ?? '') },
        returnTo: destination,
      });
    }

    try {
      if (env.API_BASE_URL) {
        await apiRequest(event, '/auth/forgot-password', env.API_BASE_URL, {
          method: 'POST',
          json: { email: result.data.email },
        });
      }
    } catch {
      // La respuesta es uniforme: no se revela si el correo existe o si la API falló.
    }

    return {
      action: 'forgot',
      step: 'forgot' as const,
      success: true,
      message: FORGOT_PASSWORD_MESSAGE,
      returnTo: destination,
    };
  },

  logout: async (event) => {
    try {
      if (env.API_BASE_URL) {
        const response = await apiRequest(event, '/auth/logout', env.API_BASE_URL, {
          method: 'POST',
        });
        forwardSessionCookies(event, response, secureCookie(event));
      }
    } catch {
      // El logout local también debe limpiar la copia aunque la API no responda.
    }
    clearSessionCookie(event, env.SESSION_COOKIE_NAME ?? 'koffisoft_session');
    redirect(303, '/');
  },
};
