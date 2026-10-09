import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Escribe un correo electrónico válido.'),
  password: z.string().min(12, 'La contraseña debe tener al menos 12 caracteres.'),
});

export const totpSchema = z.object({
  code: z.string().regex(/^\d{6}$/u, 'El código debe contener seis dígitos.'),
});

export const recoveryCodeSchema = z.object({
  code: z.string().trim().min(20, 'El código de recuperación no es válido.'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(12, 'La contraseña actual debe tener al menos 12 caracteres.'),
    newPassword: z.string().min(12, 'La nueva contraseña debe tener al menos 12 caracteres.'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Las contraseñas nuevas no coinciden.',
    path: ['confirmPassword'],
  });

export function validationMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}
