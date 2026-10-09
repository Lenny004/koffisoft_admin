import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import {
  apiErrorMessage,
  apiRequest,
  clearSessionCookie,
  forwardSessionCookies,
  readJson,
} from '$lib/server/api';
import { needsPasswordChange, type AuthenticatedUser } from '$lib/types/auth';
import {
  changePasswordSchema,
  loginSchema,
  recoveryCodeSchema,
  totpSchema,
  validationMessages,
} from '$lib/validation/auth';

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

function returnTo(event: RequestEvent): string {
  const requested = event.url.searchParams.get('returnTo');
  return requested?.startsWith('/') && !requested.startsWith('//') ? requested : '/dashboard';
}

async function authenticatedStep(event: RequestEvent): Promise<'password' | undefined> {
  if (!env.API_BASE_URL) return undefined;
  const response = await apiRequest(event, '/auth/me', env.API_BASE_URL);
  if (!response.ok) return undefined;
  const payload = (await readJson<{ user?: Record<string, unknown> }>(response)) ?? {};
  return needsPasswordChange(payload.user as AuthenticatedUser | undefined)
    ? 'password'
    : undefined;
}

export const load: PageServerLoad = () => ({});

export const actions: Actions = {
  login: async (event) => {
    const values = Object.fromEntries(await event.request.formData());
    const result = loginSchema.safeParse({
      email: values.email,
      password: values.password,
    });

    if (!result.success) {
      return fail(400, {
        action: 'login',
        errors: validationMessages(result.error),
        email: String(values.email ?? ''),
      });
    }

    let response: Response;
    try {
      response = await apiRequest(event, '/auth/login', env.API_BASE_URL ?? '', {
        method: 'POST',
        json: result.data,
      });
      forwardSessionCookies(event, response, secureCookie(event));
    } catch {
      return fail(502, {
        action: 'login',
        errors: ['No fue posible conectar con la API de autenticación.'],
        email: result.data.email,
      });
    }

    if (!response.ok) {
      return fail(response.status, {
        action: 'login',
        errors: [await apiErrorMessage(response)],
        email: result.data.email,
      });
    }

    const payload = (await readJson<LoginResponse>(response)) ?? {};
    if (payload.requiresMfa) return { action: 'login', step: 'totp' as const };
    if (payload.requiresMfaSetup) return { action: 'login', step: 'setup' as const };
    if (payload.requiresPasswordChange || payload.mustChangePassword) {
      return { action: 'login', step: 'password' as const };
    }

    redirect(303, returnTo(event));
  },

  verifyMfa: async (event) => {
    const values = Object.fromEntries(await event.request.formData());
    const result = totpSchema.safeParse({ code: values.code });
    if (!result.success)
      return fail(400, {
        action: 'verifyMfa',
        step: 'totp' as const,
        errors: validationMessages(result.error),
      });

    const response = await apiRequest(event, '/auth/mfa/verify', env.API_BASE_URL ?? '', {
      method: 'POST',
      json: result.data,
    });
    forwardSessionCookies(event, response, secureCookie(event));
    if (!response.ok)
      return fail(response.status, {
        action: 'verifyMfa',
        step: 'totp' as const,
        errors: [await apiErrorMessage(response)],
      });

    if (await authenticatedStep(event)) return { action: 'verifyMfa', step: 'password' as const };
    redirect(303, '/dashboard');
  },

  recoverMfa: async (event) => {
    const values = Object.fromEntries(await event.request.formData());
    const result = recoveryCodeSchema.safeParse({ code: values.code });
    if (!result.success)
      return fail(400, {
        action: 'recoverMfa',
        step: 'recovery' as const,
        errors: validationMessages(result.error),
      });

    const response = await apiRequest(event, '/auth/mfa/recovery', env.API_BASE_URL ?? '', {
      method: 'POST',
      json: result.data,
    });
    forwardSessionCookies(event, response, secureCookie(event));
    if (!response.ok)
      return fail(response.status, {
        action: 'recoverMfa',
        step: 'recovery' as const,
        errors: [await apiErrorMessage(response)],
      });
    redirect(303, '/dashboard');
  },

  setupMfa: async (event) => {
    const values = Object.fromEntries(await event.request.formData());
    const label =
      typeof values.label === 'string' && values.label.trim() ? values.label.trim() : undefined;
    const response = await apiRequest(event, '/auth/mfa/totp/setup', env.API_BASE_URL ?? '', {
      method: 'POST',
      json: label ? { label } : {},
    });
    if (!response.ok)
      return fail(response.status, {
        action: 'setupMfa',
        step: 'setup' as const,
        errors: [await apiErrorMessage(response)],
      });
    const payload = await readJson<MfaSetupResponse>(response);
    return {
      action: 'setupMfa',
      step: 'confirm' as const,
      uri: payload?.uri,
      label: payload?.label,
    };
  },

  confirmMfa: async (event) => {
    const values = Object.fromEntries(await event.request.formData());
    const result = totpSchema.safeParse({ code: values.code });
    if (!result.success)
      return fail(400, {
        action: 'confirmMfa',
        step: 'confirm' as const,
        errors: validationMessages(result.error),
        uri: values.uri,
      });

    const response = await apiRequest(event, '/auth/mfa/totp/confirm', env.API_BASE_URL ?? '', {
      method: 'POST',
      json: result.data,
    });
    forwardSessionCookies(event, response, secureCookie(event));
    if (!response.ok)
      return fail(response.status, {
        action: 'confirmMfa',
        step: 'confirm' as const,
        errors: [await apiErrorMessage(response)],
        uri: values.uri,
      });
    const payload = await readJson<RecoveryCodesResponse>(response);
    return {
      action: 'confirmMfa',
      step: 'recovery' as const,
      recoveryCodes: payload?.recoveryCodes ?? [],
    };
  },

  changePassword: async (event) => {
    const values = Object.fromEntries(await event.request.formData());
    const result = changePasswordSchema.safeParse(values);
    if (!result.success)
      return fail(400, {
        action: 'changePassword',
        step: 'password' as const,
        errors: validationMessages(result.error),
      });

    const response = await apiRequest(event, '/auth/password', env.API_BASE_URL ?? '', {
      method: 'POST',
      json: { currentPassword: result.data.currentPassword, newPassword: result.data.newPassword },
    });
    forwardSessionCookies(event, response, secureCookie(event));
    if (!response.ok)
      return fail(response.status, {
        action: 'changePassword',
        step: 'password' as const,
        errors: [await apiErrorMessage(response)],
      });
    redirect(303, '/dashboard');
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
    clearSessionCookie(event, env.SESSION_COOKIE_NAME ?? 'session');
    redirect(303, '/');
  },
};
