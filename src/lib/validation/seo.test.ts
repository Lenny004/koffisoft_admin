import { describe, expect, it } from 'vitest';

import { seoSchema } from './seo';

const valid = {
  id: '',
  resourceType: 'page' as const,
  resourceKey: 'home',
  metaTitle: 'Koffi-Soft | Cafe',
  metaDescription: 'Una descripcion editable de la portada.',
  ogImageUrl: 'https://site.example/og.jpg',
  canonicalUrl: 'https://site.example/',
  noindex: false,
};

describe('seoSchema', () => {
  it('alinea longitudes y URLs seguras del formulario', () => {
    expect(seoSchema.safeParse(valid).success).toBe(true);
    expect(seoSchema.safeParse({ ...valid, metaTitle: 'x'.repeat(71) }).success).toBe(false);
    expect(seoSchema.safeParse({ ...valid, ogImageUrl: 'javascript:alert(1)' }).success).toBe(
      false,
    );
  });
});
