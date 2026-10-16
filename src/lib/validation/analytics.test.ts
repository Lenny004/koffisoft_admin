import { describe, expect, it } from 'vitest';

import { analyticsFilterSchema } from './analytics';

const valid = {
  locationId: '550e8400-e29b-41d4-a716-446655440000',
  from: '2026-10-01',
  to: '2026-10-15',
};

describe('analyticsFilterSchema', () => {
  it('acepta una sede y rango dentro del contrato', () => {
    expect(analyticsFilterSchema.safeParse(valid).success).toBe(true);
  });

  it('rechaza fechas invertidas o un rango demasiado largo', () => {
    expect(analyticsFilterSchema.safeParse({ ...valid, from: '2026-10-16' }).success).toBe(false);
    expect(
      analyticsFilterSchema.safeParse({ ...valid, from: '2025-01-01', to: '2026-10-15' }).success,
    ).toBe(false);
  });
});
