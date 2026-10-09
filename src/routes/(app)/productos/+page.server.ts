import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';

import { productFixtures, type ProductFixture } from '$lib/fixtures/products';
import { apiRequest, readJson } from '$lib/server/api';

/** Mapea el listado administrativo documentado y conserva fotos locales solo como presentación. */
interface ApiMenuItem {
  id: string;
  slug: string;
  nameEs: string;
  active: boolean;
  category?: { nameEs?: string };
}

interface ApiMenuPage {
  data: ApiMenuItem[];
}

export const load: PageServerLoad = async (event) => {
  if (
    !env.API_BASE_URL ||
    !env.DEFAULT_LOCATION_ID ||
    !event.locals.permissions.includes('catalog.read')
  ) {
    return { products: productFixtures, source: 'fixture' as const };
  }

  try {
    const query = new URLSearchParams({
      locationId: env.DEFAULT_LOCATION_ID,
      page: '1',
      pageSize: '100',
    });
    const response = await apiRequest(event, `/menu/admin/items?${query}`, env.API_BASE_URL);
    if (response.ok) {
      const payload = await readJson<ApiMenuPage>(response);
      const products: ProductFixture[] = (payload?.data ?? []).map((item, index) => ({
        id: item.id,
        name: item.nameEs,
        slug: item.slug,
        category: item.category?.nameEs ?? 'Sin categoría',
        active: item.active,
        image: productFixtures[index % productFixtures.length]?.image ?? productFixtures[0].image,
      }));
      return { products, source: 'api' as const };
    }
  } catch {
    // La tabla queda utilizable con fixtures cuando la API no está disponible en desarrollo.
  }

  return { products: productFixtures, source: 'fixture' as const };
};
