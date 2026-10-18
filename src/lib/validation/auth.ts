import { z } from 'zod';

import { FORM_LIMITS } from './limits';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Escribe un correo electrónico válido.')
    .max(FORM_LIMITS.auth.emailMaxLength, 'El correo no puede superar 200 caracteres.'),
  password: z
    .string()
    .min(FORM_LIMITS.auth.passwordMinLength, 'La contraseña debe tener al menos 12 caracteres.')
    .max(FORM_LIMITS.auth.passwordMaxLength, 'La contraseña no puede superar 128 caracteres.'),
});

export const totpSchema = z.object({
  code: z.string().regex(/^\d{6}$/u, 'El código debe contener seis dígitos.'),
});

export const recoveryCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(FORM_LIMITS.auth.recoveryCodeMinLength, 'El código de recuperación no es válido.')
    .max(FORM_LIMITS.auth.recoveryCodeMaxLength, 'El código de recuperación no es válido.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(
        FORM_LIMITS.auth.passwordMinLength,
        'La contraseña actual debe tener al menos 12 caracteres.',
      )
      .max(
        FORM_LIMITS.auth.passwordMaxLength,
        'La contraseña actual no puede superar 128 caracteres.',
      ),
    newPassword: z
      .string()
      .min(
        FORM_LIMITS.auth.passwordMinLength,
        'La nueva contraseña debe tener al menos 12 caracteres.',
      )
      .max(
        FORM_LIMITS.auth.passwordMaxLength,
        'La nueva contraseña no puede superar 128 caracteres.',
      ),
    confirmPassword: z
      .string()
      .max(FORM_LIMITS.auth.passwordMaxLength, 'La contraseña no puede superar 128 caracteres.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Las contraseñas nuevas no coinciden.',
    path: ['confirmPassword'],
  });

export const initialSetupSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'Escribe el nombre.')
      .max(FORM_LIMITS.auth.personNameMaxLength, 'El nombre no puede superar 80 caracteres.'),
    lastName: z
      .string()
      .trim()
      .min(1, 'Escribe el apellido.')
      .max(FORM_LIMITS.auth.personNameMaxLength, 'El apellido no puede superar 80 caracteres.'),
    email: z
      .string()
      .trim()
      .email('Escribe un correo electrónico válido.')
      .max(FORM_LIMITS.auth.emailMaxLength, 'El correo no puede superar 200 caracteres.'),
    password: z
      .string()
      .min(FORM_LIMITS.auth.passwordMinLength, 'La contraseña debe tener al menos 12 caracteres.')
      .max(FORM_LIMITS.auth.passwordMaxLength, 'La contraseña no puede superar 128 caracteres.'),
    confirmPassword: z
      .string()
      .max(FORM_LIMITS.auth.passwordMaxLength, 'La contraseña no puede superar 128 caracteres.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export const mfaSetupSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, 'El nombre del dispositivo no puede estar vacío.')
    .max(FORM_LIMITS.auth.mfaLabelMaxLength, 'El nombre no puede superar 100 caracteres.')
    .optional(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Escribe un correo electrónico válido.')
    .max(FORM_LIMITS.auth.emailMaxLength, 'El correo no puede superar 200 caracteres.'),
});

const strongPassword = z
  .string()
  .min(
    FORM_LIMITS.passwordReset.newPasswordMinLength,
    'La contraseña debe tener al menos 12 caracteres.',
  )
  .max(
    FORM_LIMITS.passwordReset.newPasswordMaxLength,
    'La contraseña no puede superar 128 caracteres.',
  )
  .refine(
    (value) => /[A-Za-z]/u.test(value) && /\d/u.test(value),
    'La contraseña debe combinar letras y números.',
  );

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, 'El enlace de recuperación no es válido.'),
    newPassword: strongPassword,
    confirmPassword: z
      .string()
      .max(
        FORM_LIMITS.passwordReset.newPasswordMaxLength,
        'La contraseña no puede superar 128 caracteres.',
      ),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Las contraseñas nuevas no coinciden.',
    path: ['confirmPassword'],
  });

export function passwordStrengthScore(password: string): 0 | 1 | 2 | 3 {
  if (!password) return 0;
  let score = 0;
  if (password.length >= FORM_LIMITS.passwordReset.newPasswordMinLength) score += 1;
  if (/[A-Z]/u.test(password) && /[a-z]/u.test(password)) score += 1;
  if (/\d/u.test(password) && /[^A-Za-z0-9]/u.test(password)) score += 1;
  return score as 0 | 1 | 2 | 3;
}

export function validationMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}
