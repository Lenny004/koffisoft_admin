import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { createSeoClient, SeoApiError } from '$lib/server/seo';
import { formBoolean, formText } from '$lib/validation/menu';
import { formValues, validationErrors } from '$lib/validation/errors';
import { seoSchema } from '$lib/validation/seo';

/** Mensaje uniforme cuando faltan variables de entorno requeridas para esta pantalla. */
function configurationError(): string {
  return 'No se puede cargar SEO: configura API_BASE_URL y DEFAULT_LOCATION_ID.';
}

/** Mapea metadatos SEO desde FormData incluyendo noindex. */
function seoForm(formData: FormData) {
  return {
    id: formText(formData.get('id')),
    resourceType: formText(formData.get('resourceType')),
    resourceKey: formText(formData.get('resourceKey')),
    metaTitle: formText(formData.get('metaTitle')),
    metaDescription: formText(formData.get('metaDescription')),
    ogImageUrl: formText(formData.get('ogImageUrl')),
    canonicalUrl: formText(formData.get('canonicalUrl')),
    noindex: formBoolean(formData.get('noindex'), false),
  };
}

/** Normaliza errores de la API (o fallos de red) a código HTTP y mensajes para fail(). */
function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof SeoApiError) return { status: error.status, errors: [error.message] };
  return { status: 502, errors: ['La API de SEO no esta disponible en este momento.'] };
}

/** Lista registros SEO de la sede por defecto. */
export const load: PageServerLoad = async (event) => {
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;
  if (!env.API_BASE_URL || !locationId)
    return { seo: [], locationId, permissions, error: configurationError() };

  try {
    const seo = await createSeoClient(event, env.API_BASE_URL).list(locationId);
    return { seo, locationId, permissions, error: undefined };
  } catch (error) {
    return {
      seo: [],
      locationId,
      permissions,
      error: error instanceof SeoApiError ? error.message : configurationError(),
    };
  }
};

/** CRUD de metadatos SEO bajo permiso seo.manage. */
export const actions: Actions = {
  /** Crea o actualiza SEO por recurso y clave. */
  save: async (event) => {
    if (!event.locals.permissions.includes('seo.manage'))
      return fail(403, { action: 'save', errors: ['No tienes permiso para administrar SEO.'] });

    const formData = await event.request.formData();
    const result = seoSchema.safeParse(seoForm(formData));
    if (!result.success)
      return fail(400, {
        action: 'save',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });

    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!locationId) return fail(503, { action: 'save', errors: [configurationError()] });

    try {
      const client = createSeoClient(event, env.API_BASE_URL ?? '');
      const { id, resourceType, resourceKey, ...metadata } = result.data;
      if (id) await client.update(id, locationId, metadata);
      else await client.create({ locationId, resourceType, resourceKey, ...metadata });
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'save', errors: response.errors });
    }
  },
  /** Elimina un metadato SEO de la sede. */
  delete: async (event) => {
    if (!event.locals.permissions.includes('seo.manage'))
      return fail(403, { action: 'delete', errors: ['No tienes permiso para eliminar SEO.'] });

    const id = formText((await event.request.formData()).get('id'));
    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!id || !locationId)
      return fail(400, { action: 'delete', errors: ['El metadato SEO no es valido.'] });

    try {
      await createSeoClient(event, env.API_BASE_URL ?? '').remove(id, locationId);
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'delete', errors: response.errors });
    }
  },
};
