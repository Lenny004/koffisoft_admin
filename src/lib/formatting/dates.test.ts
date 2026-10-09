import { describe, expect, it } from 'vitest';

import {
  formatElSalvadorDateTime,
  isoToElSalvadorDateTimeLocal,
  localElSalvadorDateTimeToIso,
} from './dates';

describe('fechas del panel', () => {
  it('conserva el offset local requerido por la API', () => {
    expect(localElSalvadorDateTimeToIso('2026-10-24T18:30')).toBe('2026-10-24T18:30:00-06:00');
  });

  it('convierte instantes a datetime-local de El Salvador', () => {
    expect(isoToElSalvadorDateTimeLocal('2026-10-25T00:30:00.000Z')).toBe('2026-10-24T18:30');
    expect(formatElSalvadorDateTime('2026-10-25T00:30:00.000Z')).toContain('24');
  });
});
