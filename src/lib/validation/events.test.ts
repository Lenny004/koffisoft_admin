import { describe, expect, it } from 'vitest';

import { eventSchema, quoteSchema } from './events';

const locationId = '550e8400-e29b-41d4-a716-446655440001';
const eventId = '550e8400-e29b-41d4-a716-446655440002';

const validEvent = {
  locationId,
  eventType: 'Corporate',
  title: 'Reunión anual',
  contactName: 'Ana Pérez',
  contactPhone: '7000-0000',
  contactEmail: '',
  startsAt: '2026-10-24T18:00:00-06:00',
  endsAt: '2026-10-24T22:00:00-06:00',
  setupStartsAt: '',
  estimatedGuestCount: '40',
  confirmedGuestCount: '',
  budgetTarget: '1200.00',
  status: 'Inquiry',
  specialRequirements: '',
  internalNotes: '',
  preferredLanguage: 'es',
};

describe('validaciones Zod de eventos', () => {
  it('acepta un evento administrativo con fecha y offset explícitos', () => {
    expect(eventSchema.safeParse(validEvent).success).toBe(true);
  });

  it('exige al menos una línea de cotización', () => {
    const result = quoteSchema.safeParse({
      eventId,
      eventPackageId: '',
      validUntil: '2026-10-31',
      termsEs: '',
      termsEn: '',
      lines: [],
    });
    expect(result.success).toBe(false);
  });

  it('rechaza presupuesto con más de dos decimales', () => {
    expect(eventSchema.safeParse({ ...validEvent, budgetTarget: '1200.999' }).success).toBe(false);
  });
});
