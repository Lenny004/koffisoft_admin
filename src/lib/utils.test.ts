import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn', () => {
  it('combina clases de utilidad sin valores vacíos', () => {
    expect(cn('rounded-md', undefined, 'text-sm')).toBe('rounded-md text-sm');
  });
});
