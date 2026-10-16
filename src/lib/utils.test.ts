import { describe, expect, it } from 'vitest';

import { cn, parsePositivePage } from './utils';

describe('cn', () => {
  it('combina clases de utilidad sin valores vacíos', () => {
    expect(cn('rounded-md', undefined, 'text-sm')).toBe('rounded-md text-sm');
  });

  it('normaliza páginas ausentes o inválidas al primer resultado', () => {
    expect(parsePositivePage(null)).toBe(1);
    expect(parsePositivePage('0')).toBe(1);
    expect(parsePositivePage('2.5')).toBe(1);
    expect(parsePositivePage('3')).toBe(3);
  });
});
