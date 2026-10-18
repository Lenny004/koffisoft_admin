import type { CategoryRow, MenuCategory, MenuItem, MenuRow } from './types';

const imageBySlug: Record<string, string> = {
  'crepa-de-fresa': '/fixtures/products/crepe-strawberry.jpg',
  'bebida-fria-de-cola': '/fixtures/products/cola-ice.jpg',
  'cafe-especial': '/fixtures/products/coffee-special.png',
};

const imageByCategory: Record<string, string> = {
  postres: '/fixtures/products/crepe-strawberry.jpg',
  desserts: '/fixtures/products/crepe-strawberry.jpg',
  'bebidas-frias': '/fixtures/products/cola-ice.jpg',
  'bebidas-calientes': '/fixtures/products/coffee-special.png',
  bebidas: '/fixtures/products/coffee-special.png',
};

/** Normaliza texto para comparar slugs sin acentos ni espacios irregulares. */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/gu, '-');
}

/** Conserva imágenes locales como presentación, porque el contrato de menú no tiene medios. */
export function legacyImageFor(slug: string, categorySlug: string, categoryName: string): string {
  return (
    imageBySlug[slug] ??
    imageByCategory[normalize(categorySlug)] ??
    imageByCategory[normalize(categoryName)] ??
    '/fixtures/products/coffee-special.png'
  );
}

/** Proyecta una categoría del contrato de menú al modelo de filas de la tabla. */
export function mapCategory(category: MenuCategory): CategoryRow {
  return { ...category };
}

/** Enriquece el ítem con imagen local y nombres en español para la grilla administrativa. */
export function mapMenuItem(item: MenuItem): MenuRow {
  return {
    id: item.id,
    categoryId: item.categoryId,
    category: item.category.nameEs,
    categorySlug: item.category.slug,
    sku: item.sku,
    slug: item.slug,
    itemType: item.itemType,
    name: item.nameEs,
    nameEn: item.nameEn,
    descriptionEs: item.descriptionEs,
    descriptionEn: item.descriptionEn,
    publicVisible: item.publicVisible,
    active: item.active,
    variants: item.variants,
    image: legacyImageFor(item.slug, item.category.slug, item.category.nameEs),
  };
}
