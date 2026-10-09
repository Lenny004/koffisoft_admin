import { describe, expect, it } from 'vitest';

import { reservationActionsFor, reservationStatusLabel } from './types';

describe('mapeo de estados de reservación', () => {
  it('ofrece solo las transiciones documentadas por la API', () => {
    expect(reservationActionsFor('Requested')).toEqual(['confirm', 'cancel']);
    expect(reservationActionsFor('Confirmed')).toEqual(['seat', 'cancel', 'no-show']);
    expect(reservationActionsFor('Seated')).toEqual(['complete', 'cancel']);
    expect(reservationActionsFor('Completed')).toEqual([]);
  });

  it('traduce el estado sin cambiar el valor del contrato', () => {
    expect(reservationStatusLabel('PendingConfirmation')).toBe('Pendiente de confirmar');
    expect(reservationStatusLabel('NoShow')).toBe('No-show');
  });
});
