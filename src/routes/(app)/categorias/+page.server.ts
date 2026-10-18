import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { mapCategory } from '$lib/menu/mappers';
import { MenuApiError, createMenuClient } from '$lib/server/menu';
import { formValues, validationErrors } from '$lib/validation/errors';
import { categoryReorderSchema, categorySchema, formBoolean, formText } from '$lib/validation/menu';

/** Mensaje uniforme cuando faltan variables de entorno requeridas para esta pantalla. */
function configurationError(): string {
  return 'No se pudieron cargar las categorías: configura API_BASE_URL y DEFAULT_LOCATION_ID para conectar el panel con la API.';
}

/** Normaliza errores de la API (o fallos de red) a código HTTP y mensajes para fail(). */
function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof MenuApiError) return { status: error.status, errors: [error.message] };
  return { status: 502, errors: ['La API de menú no está disponible en este momento.'] };
}

/** Extrae campos de categoría del formulario incluyendo orden y estado activo. */
function categoryForm(formData: FormData) {
  return {
    slug: formText(formData.get('slug')),
    nameEs: formText(formData.get('nameEs')),
    nameEn: formText(formData.get('nameEn')),
    descriptionEs: formText(formData.get('descriptionEs')),
    descriptionEn: formText(formData.get('descriptionEn')),
    displayOrder: formText(formData.get('displayOrder')),
    active: formBoolean(formData.get('active'), true),
  };
}

/** Lista categorías del menú (con búsqueda) ordenadas por displayOrder para la sede por defecto. */
export const load: PageServerLoad = async (event) => {
  const search = event.url.searchParams.get('search')?.trim() ?? '';
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;

  if (!env.API_BASE_URL || !locationId) {
    return { categories: [], search, permissions, error: configurationError() };
  }

  try {
    const response = await createMenuClient(event, env.API_BASE_URL).listCategories({
      locationId,
      page: 1,
      pageSize: 100,
      search,
      includeInactive: true,
    });
    return {
      categories: response.data
        .map(mapCategory)
        .sort((left, right) => left.displayOrder - right.displayOrder),
      search,
      permissions,
      error: undefined,
    };
  } catch (error) {
    return {
      categories: [],
      search,
      permissions,
      error: error instanceof MenuApiError ? error.message : configurationError(),
    };
  }
};

/** Administración de categorías del catálogo bajo permiso catalog.manage. */
export const actions: Actions = {
  /** Crea o actualiza una categoría; en edición conserva displayOrder explícito. */
  save: async (event) => {
    if (!event.locals.permissions.includes('catalog.manage'))
      return fail(403, {
        action: 'save',
        errors: ['No tienes permiso para administrar categorías.'],
      });
    const formData = await event.request.formData();
    const result = categorySchema.safeParse(categoryForm(formData));
    if (!result.success)
      return fail(400, {
        action: 'save',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!locationId) return fail(503, { action: 'save', errors: [configurationError()] });

    try {
      const client = createMenuClient(event, env.API_BASE_URL ?? '');
      const id = formText(formData.get('id'));
      if (id) {
        const { displayOrder, ...payload } = result.data;
        await client.updateCategory(id, locationId, { ...payload, displayOrder });
      } else {
        await client.createCategory({ locationId, ...result.data });
      }
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'save', errors: response.errors });
    }
  },
  /** Cambia solo el flag active de la categoría. */
  toggle: async (event) => {
    if (!event.locals.permissions.includes('catalog.manage'))
      return fail(403, {
        action: 'toggle',
        errors: ['No tienes permiso para administrar categorías.'],
      });
    const formData = await event.request.formData();
    const id = formText(formData.get('id'));
    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!id || !locationId)
      return fail(400, { action: 'toggle', errors: ['La categoría no es válida.'] });
    try {
      await createMenuClient(event, env.API_BASE_URL ?? '').updateCategory(id, locationId, {
        active: formBoolean(formData.get('active')),
      });
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'toggle', errors: response.errors });
    }
  },
  /** Elimina la categoría en la API de menú. */
  delete: async (event) => {
    if (!event.locals.permissions.includes('catalog.manage'))
      return fail(403, {
        action: 'delete',
        errors: ['No tienes permiso para administrar categorías.'],
      });
    const formData = await event.request.formData();
    const id = formText(formData.get('id'));
    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!id || !locationId)
      return fail(400, { action: 'delete', errors: ['La categoría no es válida.'] });
    try {
      await createMenuClient(event, env.API_BASE_URL ?? '').deleteCategory(id, locationId);
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'delete', errors: response.errors });
    }
  },
  /** Persiste el orden enviado como JSON validado por categoryReorderSchema. */
  reorder: async (event) => {
    if (!event.locals.permissions.includes('catalog.manage'))
      return fail(403, {
        action: 'reorder',
        errors: ['No tienes permiso para reordenar categorías.'],
      });
    const formData = await event.request.formData();
    let categories: unknown;
    try {
      categories = JSON.parse(formText(formData.get('categories')) || '[]');
    } catch {
      return fail(400, { action: 'reorder', errors: ['El orden de categorías no es válido.'] });
    }
    const result = categoryReorderSchema.safeParse({ categories });
    if (!result.success)
      return fail(400, {
        action: 'reorder',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    const locationId = env.DEFAULT_LOCATION_ID ?? '';
    if (!locationId) return fail(503, { action: 'reorder', errors: [configurationError()] });
    try {
      await createMenuClient(event, env.API_BASE_URL ?? '').reorderCategories(
        locationId,
        result.data.categories,
      );
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'reorder', errors: response.errors });
    }
  },
};
