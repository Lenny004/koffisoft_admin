import { describe, expect, it } from 'vitest';

import {
  contactEventConversionSchema,
  contactFilterSchema,
  contactReservationConversionSchema,
} from './contact';

const id = '550e8400-e29b-41d4-a716-446655440000';

describe('validacion de la bandeja de contacto', () => {
  it('normaliza filtros y conserva el limite de busqueda', () => {
    expect(
      contactFilterSchema.parse({
        page: '2',
        search: 'ana@example.com',
        status: 'New',
        includeArchived: 'true',
      }),
    ).toEqual({
      page: 2,
      search: 'ana@example.com',
      status: 'New',
      includeArchived: true,
    });
  });

  it('rechaza una conversion de reserva fuera de los limites del DTO', () => {
    expect(
      contactReservationConversionSchema.safeParse({
        id,
        date: '2026-10-24',
        time: '18:30',
        partySize: '101',
        durationMinutes: '120',
        preferredSpaceId: '',
      }).success,
    ).toBe(false);
  });

  it('acepta una conversion de evento con monto de dos decimales', () => {
    expect(
      contactEventConversionSchema.safeParse({
        id,
        eventType: 'Corporate',
        title: 'Reunion de equipo',
        startsAt: '2026-10-24T18:30',
        endsAt: '2026-10-24T21:30',
        estimatedGuestCount: '20',
        budgetTarget: '500.00',
      }).success,
    ).toBe(true);
  });
});
