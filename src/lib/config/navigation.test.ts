import { describe, expect, it } from 'vitest';

import { filterNavigation, requiredPermissionForPath } from './navigation';

describe('navigation permissions', () => {
  it('only exposes modules whose permission is effective', () => {
    const items = filterNavigation(['catalog.read', 'reservations.read']);
    expect(items.map((item) => item.href)).toEqual([
      '/dashboard',
      '/productos',
      '/categorias',
      '/reservaciones',
    ]);
  });

  it('maps nested routes to the module permission', () => {
    expect(requiredPermissionForPath('/productos/123')).toBe('catalog.read');
    expect(requiredPermissionForPath('/dashboard')).toBeUndefined();
  });
});
