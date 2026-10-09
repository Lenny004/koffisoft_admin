import { describe, expect, it } from 'vitest';

import { legacyImageFor, mapMenuItem } from './mappers';

describe('mapeos del catálogo', () => {
  it('elige una imagen provisional por slug antes que por categoría', () => {
    expect(legacyImageFor('crepa-de-fresa', 'bebidas', 'Bebidas')).toBe(
      '/fixtures/products/crepe-strawberry.jpg',
    );
  });

  it('normaliza acentos al buscar la imagen de una categoría', () => {
    expect(legacyImageFor('otro', 'postres', 'Postres')).toBe(
      '/fixtures/products/crepe-strawberry.jpg',
    );
  });

  it('conserva el contrato administrativo sin inventar una imagen API', () => {
    const row = mapMenuItem({
      id: 'item-1',
      categoryId: 'category-1',
      category: { id: 'category-1', slug: 'coffee', nameEs: 'Café' },
      sku: 'COF-1',
      slug: 'latte',
      itemType: 'beverage',
      nameEs: 'Latte',
      nameEn: 'Latte',
      descriptionEs: null,
      descriptionEn: null,
      publicVisible: true,
      active: true,
      variants: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(row).toMatchObject({
      id: 'item-1',
      category: 'Café',
      image: '/fixtures/products/coffee-special.png',
    });
    expect('imageUrl' in row).toBe(false);
  });
});
