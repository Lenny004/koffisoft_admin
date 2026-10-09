import { describe, expect, it } from 'vitest';

import { availabilitySchema, categorySchema, itemSchema, priceSchema } from './menu';

describe('validación Zod del menú', () => {
  it('acepta una categoría compatible con el DTO de la API', () => {
    expect(
      categorySchema.safeParse({
        slug: 'coffee',
        nameEs: 'Café',
        nameEn: 'Coffee',
        descriptionEs: '',
        descriptionEn: '',
        displayOrder: '0',
        active: true,
      }).success,
    ).toBe(true);
  });

  it('rechaza slugs de producto que no son seguros para el contrato', () => {
    expect(
      itemSchema.safeParse({
        categoryId: '550e8400-e29b-41d4-a716-446655440000',
        sku: 'SKU-1',
        slug: 'Latte con leche',
        itemType: 'Beverage',
        nameEs: 'Latte',
        nameEn: 'Latte',
        descriptionEs: '',
        descriptionEn: '',
        publicVisible: true,
        active: true,
      }).success,
    ).toBe(false);
  });

  it('valida el UUID de tasa y las fechas de un precio', () => {
    expect(
      priceSchema.safeParse({
        variantId: '550e8400-e29b-41d4-a716-446655440000',
        locationId: '550e8400-e29b-41d4-a716-446655440001',
        channel: 'Web',
        price: '4.50',
        taxRateId: '550e8400-e29b-41d4-a716-446655440002',
        validFrom: '2026-01-01',
        validTo: '',
        includesTax: true,
      }).success,
    ).toBe(true);
  });

  it('rechaza un precio fuera de Decimal(14,2)', () => {
    expect(
      priceSchema.safeParse({
        variantId: '550e8400-e29b-41d4-a716-446655440000',
        locationId: '550e8400-e29b-41d4-a716-446655440001',
        channel: 'Web',
        price: '10000000000.00',
        taxRateId: '550e8400-e29b-41d4-a716-446655440002',
        validFrom: '2026-01-01',
        includesTax: true,
      }).success,
    ).toBe(false);
  });

  it('acepta disponibilidad que cruza medianoche con horario HH:mm', () => {
    expect(
      availabilitySchema.safeParse({
        variantId: '550e8400-e29b-41d4-a716-446655440000',
        locationId: '550e8400-e29b-41d4-a716-446655440001',
        channel: 'Web',
        dayOfWeek: '5',
        startsAt: '22:00',
        endsAt: '02:00',
        crossesMidnight: true,
        validFrom: '',
        validTo: '',
      }).success,
    ).toBe(true);
  });
});
