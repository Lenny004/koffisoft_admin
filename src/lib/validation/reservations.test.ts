import { describe, expect, it } from 'vitest';

import { assignTablesSchema, createReservationSchema, venueSpaceSchema } from './reservations';

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

  it('acepta la creación interna con cliente o contacto y estado permitido', () => {
    const result = createReservationSchema.safeParse({
      locationId,
      customerId: '',
      contactName: 'Ana',
      contactPhone: '+503 0000-0000',
      contactEmail: '',
      date: '2026-10-24',
      time: '18:30',
      partySize: '2',
      durationMinutes: '120',
      preferredSpaceId: '',
      internalNotes: '',
      status: 'Confirmed',
      tableIds: [],
    });
    expect(result.success).toBe(true);
  });

  it('rechaza la creación interna sin cliente ni nombre de contacto', () => {
    const result = createReservationSchema.safeParse({
      locationId,
      customerId: '',
      contactName: '',
      contactPhone: '+503 0000-0000',
      date: '2026-10-24',
      time: '18:30',
      partySize: 2,
      durationMinutes: 120,
      preferredSpaceId: '',
      internalNotes: '',
      status: 'PendingConfirmation',
      tableIds: [],
    });
    expect(result.success).toBe(false);
  });

  it('rechaza nombres que superan el VarChar de la reserva', () => {
    expect(
      createReservationSchema.safeParse({
        locationId,
        customerId: '',
        contactName: 'a'.repeat(201),
        contactPhone: '+503 0000-0000',
        contactEmail: '',
        date: '2026-10-24',
        time: '18:30',
        partySize: 2,
        durationMinutes: 120,
        preferredSpaceId: '',
        internalNotes: '',
        status: 'PendingConfirmation',
        tableIds: [],
      }).success,
    ).toBe(false);
  });
});
