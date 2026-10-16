import { describe, expect, it } from 'vitest';

import { backupCreateSchema, backupDeleteSchema } from './backups';

describe('backup validation', () => {
  it('acepta únicamente los tipos de respaldo del contrato', () => {
    expect(backupCreateSchema.safeParse({ type: 'full' }).success).toBe(true);
    expect(backupCreateSchema.safeParse({ type: 'arbitrary-path' }).success).toBe(false);
  });

  it('valida el UUID antes de enviarlo al BFF', () => {
    expect(
      backupDeleteSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' }).success,
    ).toBe(true);
    expect(backupDeleteSchema.safeParse({ id: '../backup' }).success).toBe(false);
  });
});
