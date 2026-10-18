import { describe, expect, it } from 'vitest';

import { maintenanceFilterSchema, resourceFilterSchema } from './resources';

describe('validaciones Zod de recursos', () => {
  it('acepta filtros de listado vacíos con página por defecto', () => {
    expect(resourceFilterSchema.parse({}).page).toBe(1);
  });

  it('acepta el filtro de mantenimientos global o por recurso', () => {
    const parsed = maintenanceFilterSchema.parse({
      page: '2',
      resourceId: '550e8400-e29b-41d4-a716-446655440001',
      completed: 'false',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    expect(parsed).toEqual({
      page: 2,
      resourceId: '550e8400-e29b-41d4-a716-446655440001',
      completed: 'false',
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
  });

  it('rechaza un resourceId que no es UUID', () => {
    expect(maintenanceFilterSchema.safeParse({ resourceId: 'recurso-1' }).success).toBe(false);
  });
});
