import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

import { mapCategory, mapMenuItem } from '$lib/menu/mappers';
import type { MenuItem } from '$lib/menu/types';
import {
  availabilitySchema,
  allergenSchema,
  formBoolean,
  formText,
  itemSchema,
  priceSchema,
} from '$lib/validation/menu';
import { MenuApiError, createMenuClient } from '$lib/server/menu';
import { formValues, validationErrors } from '$lib/validation/errors';

const PAGE_SIZE = 20;

function configurationError(): string {
  return 'No se pudo cargar el catálogo: configura API_BASE_URL y DEFAULT_LOCATION_ID para conectar el panel con la API.';
}

function actionError(error: unknown): { status: number; errors: string[] } {
  if (error instanceof MenuApiError) return { status: error.status, errors: [error.message] };
  return { status: 502, errors: ['La API de menú no está disponible en este momento.'] };
}

function itemForm(formData: FormData) {
  return {
    categoryId: formText(formData.get('categoryId')),
    sku: formText(formData.get('sku')),
    slug: formText(formData.get('slug')),
    itemType: formText(formData.get('itemType')),
    nameEs: formText(formData.get('nameEs')),
    nameEn: formText(formData.get('nameEn')),
    descriptionEs: formText(formData.get('descriptionEs')),
    descriptionEn: formText(formData.get('descriptionEn')),
    publicVisible: formBoolean(formData.get('publicVisible'), true),
    active: formBoolean(formData.get('active'), true),
  };
}

async function listFilteredItems(
  client: ReturnType<typeof createMenuClient>,
  locationId: string,
  page: number,
  search: string,
  categoryId: string,
) {
  if (!categoryId) {
    const response = await client.listItems({
      locationId,
      page,
      pageSize: PAGE_SIZE,
      search,
      includeInactive: true,
    });
    return { products: response.data.map(mapMenuItem), meta: response.meta };
  }

  // El contrato actual no admite categoryId en el query; el BFF compone el filtro
  // recorriendo únicamente las páginas del endpoint documentado.
  const firstPage = await client.listItems({
    locationId,
    page: 1,
    pageSize: 100,
    search,
    includeInactive: true,
  });
  const items: MenuItem[] = [...firstPage.data];
  for (let currentPage = 2; currentPage <= firstPage.meta.totalPages; currentPage += 1) {
    const nextPage = await client.listItems({
      locationId,
      page: currentPage,
      pageSize: 100,
      search,
      includeInactive: true,
    });
    items.push(...nextPage.data);
  }

  const filtered = items.filter((item) => item.categoryId === categoryId);
  const offset = (page - 1) * PAGE_SIZE;
  return {
    products: filtered.slice(offset, offset + PAGE_SIZE).map(mapMenuItem),
    meta: {
      page,
      pageSize: PAGE_SIZE,
      total: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)),
    },
  };
}

export const load: PageServerLoad = async (event) => {
  const page = Math.max(1, Number(event.url.searchParams.get('page') || 1));
  const search = event.url.searchParams.get('search')?.trim() ?? '';
  const categoryId = event.url.searchParams.get('categoryId') ?? '';
  const locationId = env.DEFAULT_LOCATION_ID ?? '';
  const permissions = event.locals.permissions;

  if (!env.API_BASE_URL || !locationId) {
    return {
      products: [],
      categories: [],
      allergens: [],
      locationId,
      meta: { page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 },
      search,
      categoryId,
      permissions,
      error: configurationError(),
    };
  }

  try {
    const client = createMenuClient(event, env.API_BASE_URL);
    const [categoriesResponse, productsResponse, allergensResponse] = await Promise.all([
      client.listCategories({ locationId, page: 1, pageSize: 100, includeInactive: true }),
      listFilteredItems(client, locationId, page, search, categoryId),
      client.listAllergens({ page: 1, pageSize: 100 }),
    ]);

    return {
      products: productsResponse.products,
      categories: categoriesResponse.data.map(mapCategory),
      allergens: allergensResponse.data,
      locationId,
      meta: productsResponse.meta,
      search,
      categoryId,
      permissions,
      error: undefined,
    };
  } catch (error) {
    return {
      products: [],
      categories: [],
      allergens: [],
      locationId,
      meta: { page, pageSize: PAGE_SIZE, total: 0, totalPages: 1 },
      search,
      categoryId,
      permissions,
      error: error instanceof MenuApiError ? error.message : configurationError(),
    };
  }
};

export const actions: Actions = {
  save: async (event) => {
    if (!event.locals.permissions.includes('catalog.manage'))
      return fail(403, {
        action: 'save',
        errors: ['No tienes permiso para administrar el catálogo.'],
      });

    const formData = await event.request.formData();
    const result = itemSchema.safeParse(itemForm(formData));
    if (!result.success)
      return fail(400, {
        action: 'save',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });

    try {
      const client = createMenuClient(event, env.API_BASE_URL ?? '');
      const id = formText(formData.get('id'));
      if (id) await client.updateItem(id, result.data);
      else await client.createItem(result.data);
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'save', errors: response.errors });
    }
  },
  toggle: async (event) => {
    if (!event.locals.permissions.includes('catalog.manage'))
      return fail(403, {
        action: 'toggle',
        errors: ['No tienes permiso para administrar el catálogo.'],
      });
    const formData = await event.request.formData();
    const id = formText(formData.get('id'));
    if (!id) return fail(400, { action: 'toggle', errors: ['El producto no es válido.'] });
    try {
      await createMenuClient(event, env.API_BASE_URL ?? '').updateItem(id, {
        active: formBoolean(formData.get('active')),
      });
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'toggle', errors: response.errors });
    }
  },
  delete: async (event) => {
    if (!event.locals.permissions.includes('catalog.manage'))
      return fail(403, {
        action: 'delete',
        errors: ['No tienes permiso para administrar el catálogo.'],
      });
    const id = formText((await event.request.formData()).get('id'));
    if (!id) return fail(400, { action: 'delete', errors: ['El producto no es válido.'] });
    try {
      await createMenuClient(event, env.API_BASE_URL ?? '').deleteItem(id);
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'delete', errors: response.errors });
    }
  },
  price: async (event) => {
    if (!event.locals.permissions.includes('menu_prices.manage'))
      return fail(403, {
        action: 'price',
        errors: ['No tienes permiso para administrar precios.'],
      });
    const formData = await event.request.formData();
    const result = priceSchema.safeParse({
      variantId: formText(formData.get('variantId')),
      locationId: formText(formData.get('locationId')),
      channel: formText(formData.get('channel')),
      price: formText(formData.get('price')),
      taxRateId: formText(formData.get('taxRateId')),
      validFrom: formText(formData.get('validFrom')),
      validTo: formText(formData.get('validTo')),
      includesTax: formBoolean(formData.get('includesTax'), true),
    });
    if (!result.success)
      return fail(400, {
        action: 'price',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    const { variantId, ...payload } = result.data;
    try {
      await createMenuClient(event, env.API_BASE_URL ?? '').createPrice(variantId, {
        ...payload,
        ...(payload.validTo ? {} : { validTo: undefined }),
      });
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'price', errors: response.errors });
    }
  },
  allergens: async (event) => {
    if (!event.locals.permissions.includes('catalog.manage'))
      return fail(403, {
        action: 'allergens',
        errors: ['No tienes permiso para administrar alérgenos.'],
      });
    const formData = await event.request.formData();
    let allergens: unknown;
    try {
      allergens = JSON.parse(formText(formData.get('allergens')) || '[]');
    } catch {
      return fail(400, { action: 'allergens', errors: ['El formato de alérgenos no es válido.'] });
    }
    const result = allergenSchema.safeParse({
      variantId: formText(formData.get('variantId')),
      allergens,
    });
    if (!result.success)
      return fail(400, {
        action: 'allergens',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    try {
      const { variantId, allergens: payload } = result.data;
      await createMenuClient(event, env.API_BASE_URL ?? '').replaceVariantAllergens(
        variantId,
        payload,
      );
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'allergens', errors: response.errors });
    }
  },
  availability: async (event) => {
    if (!event.locals.permissions.includes('menu_availability.manage'))
      return fail(403, {
        action: 'availability',
        errors: ['No tienes permiso para administrar disponibilidad.'],
      });
    const formData = await event.request.formData();
    const result = availabilitySchema.safeParse({
      variantId: formText(formData.get('variantId')),
      locationId: formText(formData.get('locationId')),
      channel: formText(formData.get('channel')),
      dayOfWeek: formText(formData.get('dayOfWeek')),
      startsAt: formText(formData.get('startsAt')),
      endsAt: formText(formData.get('endsAt')),
      crossesMidnight: formBoolean(formData.get('crossesMidnight')),
      validFrom: formText(formData.get('validFrom')),
      validTo: formText(formData.get('validTo')),
    });
    if (!result.success)
      return fail(400, {
        action: 'availability',
        errors: validationErrors(result.error),
        values: formValues(formData),
      });
    const { variantId, ...payload } = result.data;
    try {
      await createMenuClient(event, env.API_BASE_URL ?? '').createAvailability(variantId, {
        ...payload,
        ...(payload.validFrom ? {} : { validFrom: undefined }),
        ...(payload.validTo ? {} : { validTo: undefined }),
      });
      return { success: true };
    } catch (error) {
      const response = actionError(error);
      return fail(response.status, { action: 'availability', errors: response.errors });
    }
  },
};
