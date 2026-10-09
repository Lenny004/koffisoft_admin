import { describe, expect, it } from 'vitest';

import { assignTablesSchema, venueSpaceSchema } from './reservations';

const locationId = '550e8400-e29b-41d4-a716-446655440001';

describe('validaciones Zod de reservaciones', () => {
  it('acepta un espacio con capacidad válida', () => {
    const result = venueSpaceSchema.safeParse({
      locationId,
      code: 'TERRACE',
      nameEs: 'Terraza',
      nameEn: 'Terrace',
      spaceType: 'terrace',
      seatedCapacity: '30',
      standingCapacity: '',
      allowsTableReservation: true,
      allowsPrivateEvent: true,
      active: true,
    });
    expect(result.success).toBe(true);
  });

  it('rechaza una reasignación con identificadores inválidos', () => {
    const result = assignTablesSchema.safeParse({
      reservationId: 'not-a-uuid',
      tableIds: ['table-1'],
    });
    expect(result.success).toBe(false);
  });
});
