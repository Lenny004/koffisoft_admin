import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { createSiteClient, SiteApiError } from '$lib/server/site';
import { formText } from '$lib/validation/menu';
import { formValues, validationErrors } from '$lib/validation/errors';
import { siteContentSchema } from '$lib/validation/site';

/** Mensaje uniforme cuando faltan variables de entorno requeridas para esta pantalla. */
function configurationError(): string {
  return 'Configura API_BASE_URL y DEFAULT_LOCATION_ID para editar el sitio.';
}

/** Parsea arrays JSON del formulario del sitio; devuelve [] si el JSON es inválido. */
function parseJson(formData: FormData, name: string): unknown {
  try {
    return JSON.parse(formText(formData.get(name)) || '[]');
  } catch {
    return [];
  }
}

/** Arma el objeto anidado location/profile/hours/overrides desde FormData. */
function formPayload(formData: FormData) {
  return {
    location: {
      addressLine: formText(formData.get('addressLine')),
      municipality: formText(formData.get('municipality')),
      department: formText(formData.get('department')),
      phone: formText(formData.get('phone')),
      email: formText(formData.get('email')),
      latitude: formText(formData.get('latitude')),
      longitude: formText(formData.get('longitude')),
    },
    profile: {
      heroEyebrow: formText(formData.get('heroEyebrow')),
      heroTitle: formText(formData.get('heroTitle')),
      heroDescription: formText(formData.get('heroDescription')),
      heroImageUrl: formText(formData.get('heroImageUrl')),
      aboutTitle: formText(formData.get('aboutTitle')),
      aboutDescription: formText(formData.get('aboutDescription')),
      aboutMission: formText(formData.get('aboutMission')),
      aboutVision: formText(formData.get('aboutVision')),
      aboutTeam: parseJson(formData, 'aboutTeam'),
      socialFacebookUrl: formText(formData.get('socialFacebookUrl')),
      socialInstagramUrl: formText(formData.get('socialInstagramUrl')),
      socialTikTokUrl: formText(formData.get('socialTikTokUrl')),
    },
    hours: parseJson(formData, 'hours'),
    overrides: parseJson(formData, 'overrides'),
  };
}

/** Obtiene contenido editorial del sitio público para la sede configurada. */
export const load: PageServerLoad = async (event) => {
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;
  if (!env.API_BASE_URL || !locationId)
    return { site: null, locationId, permissions, error: configurationError() };

  try {
    const site = await createSiteClient(event, env.API_BASE_URL).get(locationId);
    return { site, locationId, permissions, error: undefined };
  } catch (error) {
    return {
      site: null,
      locationId,
      permissions,
      error: error instanceof SiteApiError ? error.message : configurationError(),
    };
  }
};

/** Actualiza contenido del sitio bajo permiso site_content.manage. */
export const actions: Actions = {
  /** Valida siteContentSchema y persiste el perfil completo del sitio. */
  save: async (event) => {
    if (!event.locals.permissions.includes('site_content.manage'))
      return fail(403, {
        action: 'save',
        errors: ['No tienes permiso para administrar el sitio.'],
      });

    const formData = await event.request.formData();
    const result = siteContentSchema.safeParse(formPayload(formData));
    if (!result.success)
      return fail(400, {
        action: 'save',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });

    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!locationId) return fail(503, { action: 'save', errors: [configurationError()] });
    try {
      await createSiteClient(event, env.API_BASE_URL ?? '').update(locationId, result.data);
      return { success: true };
    } catch (error) {
      return fail(error instanceof SiteApiError ? error.status : 502, {
        action: 'save',
        errors: [
          error instanceof SiteApiError ? error.message : 'La API del sitio no está disponible.',
        ],
      });
    }
  },
};
