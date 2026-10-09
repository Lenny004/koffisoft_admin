import { describe, expect, it } from 'vitest';

import { eventStatusLabel, eventTypeLabel, quoteStatusLabel } from './types';

describe('mapeo de estados de eventos', () => {
  it('traduce estados y tipos del contrato para la interfaz', () => {
    expect(eventStatusLabel('InProgress')).toBe('En curso');
    expect(eventTypeLabel('Wedding')).toBe('Boda');
    expect(quoteStatusLabel('Accepted')).toBe('Aceptada');
  });
});
