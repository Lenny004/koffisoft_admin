import { describe, expect, it } from 'vitest';

import {
  changePasswordSchema,
  initialSetupSchema,
  loginSchema,
  mfaSetupSchema,
  totpSchema,
} from './auth';

describe('validación de autenticación', () => {
  it('acepta correo y contraseña con el contrato mínimo de la API', () => {
    expect(
      loginSchema.safeParse({ email: 'admin@example.com', password: 'a-secure-password' }).success,
    ).toBe(true);
  });

  it('rechaza un código TOTP que no tiene seis dígitos', () => {
    expect(totpSchema.safeParse({ code: '12ab' }).success).toBe(false);
  });

  it('aplica el máximo de contraseña y etiqueta MFA del DTO', () => {
    expect(
      loginSchema.safeParse({
        email: 'a'.repeat(201) + '@example.com',
        password: 'a-secure-password',
      }).success,
    ).toBe(false);
    expect(mfaSetupSchema.safeParse({ label: 'a'.repeat(101) }).success).toBe(false);
  });

  it('exige que el alta inicial confirme la misma contraseña', () => {
    expect(
      initialSetupSchema.safeParse({
        firstName: 'Ana',
        lastName: 'López',
        email: 'ana@example.com',
        password: 'a-secure-password',
        confirmPassword: 'a-secure-password',
      }).success,
    ).toBe(true);
    expect(
      initialSetupSchema.safeParse({
        firstName: 'Ana',
        lastName: 'López',
        email: 'ana@example.com',
        password: 'a-secure-password',
        confirmPassword: 'otra-clave-distinta',
      }).success,
    ).toBe(false);
  });

  it('exige confirmar la nueva contraseña', () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: 'current-password',
        newPassword: 'new-password-123',
        confirmPassword: 'different-password',
      }).success,
    ).toBe(false);
  });
});
