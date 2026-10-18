import { describe, expect, it } from 'vitest';

import { purchaseOrderReplaceLinesSchema, purchaseOrderUpdateSchema } from './purchase-orders';

const orderId = '550e8400-e29b-41d4-a716-446655440001';
const ingredientId = '550e8400-e29b-41d4-a716-446655440002';
const unitId = '550e8400-e29b-41d4-a716-446655440003';
const lineId = '550e8400-e29b-41d4-a716-446655440004';

describe('validaciones Zod de órdenes de compra', () => {
  it('acepta actualizar un borrador con líneas existentes y nuevas', () => {
    expect(
      purchaseOrderUpdateSchema.safeParse({
        id: orderId,
        expectedDelivery: '2026-10-20',
        notes: 'Entregar por la mañana',
        lines: [
          {
            id: lineId,
            ingredientId,
            unitId,
            quantityOrdered: '12',
            unitCost: '3.50',
          },
          {
            id: '',
            ingredientId,
            unitId,
            quantityOrdered: '2',
            unitCost: '1.25',
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('exige al menos una línea al reemplazar el borrador', () => {
    expect(
      purchaseOrderReplaceLinesSchema.safeParse({
        id: orderId,
        lines: [],
      }).success,
    ).toBe(false);
  });
});
