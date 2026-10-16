import { describe, expect, it } from 'vitest';

import { safeReturnTo } from './return-to';

describe('safeReturnTo', () => {
  it('conserva una ruta interna con su consulta', () => {
    expect(safeReturnTo('/inventario?page=2', 'http://admin.test')).toBe('/inventario?page=2');
  });

  it('rechaza destinos que pueden salir del panel', () => {
    expect(safeReturnTo('//attacker.test/login', 'http://admin.test')).toBe('/dashboard');
    expect(safeReturnTo('/\\attacker.test/login', 'http://admin.test')).toBe('/dashboard');
  });
});
