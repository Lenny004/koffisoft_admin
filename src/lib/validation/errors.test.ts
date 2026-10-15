import { describe, expect, it } from 'vitest';

import { fieldError, globalErrors } from './errors';

describe('errores de formularios', () => {
  it('separa errores de campo y errores generales', () => {
    const errors = { email: 'Correo inválido.', _form: 'No se pudo guardar.' };

    expect(fieldError(errors, 'email')).toBe('Correo inválido.');
    expect(globalErrors(errors)).toEqual(['No se pudo guardar.']);
  });

  it('conserva las respuestas de actions que llegan como lista', () => {
    expect(globalErrors(['La API no responde.'])).toEqual(['La API no responde.']);
    expect(fieldError(['La API no responde.'], 'email')).toBe('');
  });
});
