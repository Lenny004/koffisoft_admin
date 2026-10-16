import { describe, expect, it } from 'vitest';

import { adjustmentSchema, receiptSchema, supplierSchema } from './inventory';

const locationId = '550e8400-e29b-41d4-a716-446655440001';
const supplierId = '550e8400-e29b-41d4-a716-446655440002';
const storageLocationId = '550e8400-e29b-41d4-a716-446655440003';
const ingredientId = '550e8400-e29b-41d4-a716-446655440004';
const unitId = '550e8400-e29b-41d4-a716-446655440005';

describe('validaciones Zod de inventario', () => {
  it('acepta un proveedor compatible con los límites del DTO', () => {
    expect(
      supplierSchema.safeParse({
        locationId,
        supplierCode: 'SUP-001',
        name: 'Proveedor de prueba',
        taxId: '',
        phone: '+503 7000 0000',
        email: 'compras@example.com',
        addressLine: '',
        active: true,
      }).success,
    ).toBe(true);
  });

  it('valida una recepción con lote, cantidad, costo y vencimiento', () => {
    expect(
      receiptSchema.safeParse({
        locationId,
        supplierId,
        receiptNumber: 'GR-2026-001',
        receivedAt: '2026-10-12T08:00:00-06:00',
        storageLocationId,
        notes: '',
        lines: [
          {
            ingredientId,
            unitId,
            lotCode: 'LOT-001',
            receivedOn: '2026-10-12',
            expiresOn: '2026-11-12',
            quantityReceived: '1000',
            unitCost: '0.028',
          },
        ],
      }).success,
    ).toBe(true);
  });

  it('rechaza una merma con motivo demasiado corto o cantidad no positiva', () => {
    expect(
      adjustmentSchema.safeParse({
        locationId,
        storageLocationId,
        ingredientId,
        inventoryLotId: '',
        movementType: 'waste',
        quantity: '0',
        unitCost: '0',
        reason: 'ok',
      }).success,
    ).toBe(false);
  });

  it('rechaza decimales que exceden numeric(14,6)', () => {
    expect(
      adjustmentSchema.safeParse({
        locationId,
        storageLocationId,
        ingredientId,
        movementType: 'adjustment_in',
        quantity: '100000000',
        unitCost: '0',
        reason: 'Saldo inicial',
      }).success,
    ).toBe(false);
  });
});
