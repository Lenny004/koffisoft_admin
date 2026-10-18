import { describe, expect, it } from 'vitest';

import { forgotPasswordSchema, passwordStrengthScore, resetPasswordSchema } from './auth';

describe('recuperación de contraseña', () => {
  it('acepta un correo válido en la solicitud', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'ana@koffisoft.com' });
    expect(result.success).toBe(true);
  });

  it('exige fortaleza y confirmación al restablecer', () => {
    const weak = resetPasswordSchema.safeParse({
      token: 'token-valido',
      newPassword: 'abcdefghijkl',
      confirmPassword: 'abcdefghijkl',
    });
    expect(weak.success).toBe(false);

    const mismatch = resetPasswordSchema.safeParse({
      token: 'token-valido',
      newPassword: 'CafeSeguro12',
      confirmPassword: 'CafeSeguro13',
    });
    expect(mismatch.success).toBe(false);

    const ok = resetPasswordSchema.safeParse({
      token: 'token-valido',
      newPassword: 'CafeSeguro12',
      confirmPassword: 'CafeSeguro12',
    });
    expect(ok.success).toBe(true);
  });

  it('puntúa la fortaleza de forma incremental', () => {
    expect(passwordStrengthScore('')).toBe(0);
    expect(passwordStrengthScore('abcdefghijkl')).toBe(1);
    expect(passwordStrengthScore('Abcdefghijkl')).toBe(2);
    expect(passwordStrengthScore('Abcdefghijk1!')).toBe(3);
  });
});
