import { z } from 'zod';

import { EMPLOYEE_STATUSES, JOB_CODES, USER_STATUSES } from '$lib/users/types';
import { FORM_LIMITS, FORM_PATTERNS } from './limits';

const emptyAsUndefined = (value: string) => (value === '' ? undefined : value);
const emptyAsNull = (value: string) => (value === '' ? null : value);

const optionalUuid = z
  .union([z.string().uuid('Selecciona un registro válido.'), z.literal('')])
  .transform(emptyAsNull);

const optionalPhone = z
  .string()
  .trim()
  .max(FORM_LIMITS.user.phoneMaxLength, 'El teléfono no puede superar 40 caracteres.')
  .transform(emptyAsNull);

const optionalEmail = z
  .union([
    z
      .string()
      .trim()
      .email('Escribe un correo electrónico válido.')
      .max(FORM_LIMITS.user.emailMaxLength, 'El correo no puede superar 200 caracteres.'),
    z.literal(''),
  ])
  .transform((value) => (typeof value === 'string' ? value.toLowerCase() : value));

const username = z
  .string()
  .trim()
  .min(FORM_LIMITS.user.usernameMinLength, 'El usuario debe tener al menos 3 caracteres.')
  .max(FORM_LIMITS.user.usernameMaxLength, 'El usuario no puede superar 100 caracteres.')
  .regex(FORM_PATTERNS.username, 'Usa letras, números, puntos, guiones o guion bajo.');

const password = z
  .string()
  .min(FORM_LIMITS.user.passwordMinLength, 'La contraseña debe tener al menos 12 caracteres.')
  .max(FORM_LIMITS.user.passwordMaxLength, 'La contraseña no puede superar 128 caracteres.');

export const userFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z
    .string()
    .trim()
    .max(FORM_LIMITS.user.searchMaxLength, 'La búsqueda no puede superar 200 caracteres.')
    .default(''),
  status: z.enum(USER_STATUSES).or(z.literal('')).default(''),
  role: z
    .string()
    .trim()
    .max(FORM_LIMITS.user.roleCodeMaxLength)
    .regex(FORM_PATTERNS.roleCode, 'El código de rol no es válido.')
    .or(z.literal(''))
    .default(''),
});

export const employeeFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z
    .string()
    .trim()
    .max(FORM_LIMITS.user.searchMaxLength, 'La búsqueda no puede superar 200 caracteres.')
    .default(''),
  status: z.enum(EMPLOYEE_STATUSES).or(z.literal('')).default(''),
  jobCode: z.enum(JOB_CODES).or(z.literal('')).default(''),
});

export const createUserSchema = z
  .object({
    username,
    email: z
      .string()
      .trim()
      .email('Escribe un correo electrónico válido.')
      .max(FORM_LIMITS.user.emailMaxLength, 'El correo no puede superar 200 caracteres.')
      .transform((value) => value.toLowerCase()),
    password,
    confirmPassword: password,
    employeeId: optionalUuid,
    roleIds: z.array(z.string().uuid('Uno de los roles no es válido.')).default([]),
    mustChangePassword: z.boolean().default(false),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

export const updateUserSchema = z.object({
  id: z.string().uuid('El usuario no es válido.'),
  username,
  email: z
    .string()
    .trim()
    .email('Escribe un correo electrónico válido.')
    .max(FORM_LIMITS.user.emailMaxLength, 'El correo no puede superar 200 caracteres.')
    .transform((value) => value.toLowerCase()),
  employeeId: optionalUuid,
});

export const assignRolesSchema = z.object({
  id: z.string().uuid('El usuario no es válido.'),
  roleIds: z.array(z.string().uuid('Uno de los roles no es válido.')).default([]),
});

export const userActionSchema = z.object({
  id: z.string().uuid('El usuario no es válido.'),
  action: z.enum(['activate', 'deactivate', 'block']),
});

const employeeFields = {
  employeeCode: z
    .string()
    .trim()
    .min(1, 'El código de empleado es obligatorio.')
    .max(FORM_LIMITS.user.employeeCodeMaxLength, 'El código no puede superar 30 caracteres.'),
  firstName: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(FORM_LIMITS.user.employeeNameMaxLength, 'El nombre no puede superar 80 caracteres.'),
  lastName: z
    .string()
    .trim()
    .min(1, 'El apellido es obligatorio.')
    .max(FORM_LIMITS.user.employeeNameMaxLength, 'El apellido no puede superar 80 caracteres.'),
  jobCode: z.enum(JOB_CODES, { message: 'Selecciona un cargo válido.' }),
  hireDate: z.string().date('La fecha de contratación no es válida.'),
  status: z.enum(EMPLOYEE_STATUSES, { message: 'Selecciona un estado válido.' }),
  phone: optionalPhone,
  email: optionalEmail,
  userId: optionalUuid,
};

export const createEmployeeSchema = z.object({
  locationId: z.string().uuid('La sede no es válida.'),
  ...employeeFields,
});

export const updateEmployeeSchema = z.object({
  id: z.string().uuid('El empleado no es válido.'),
  ...employeeFields,
  terminationDate: z
    .union([z.string().date('La fecha de terminación no es válida.'), z.literal('')])
    .transform(emptyAsUndefined),
});

export type UserFilterValues = z.infer<typeof userFilterSchema>;
export type EmployeeFilterValues = z.infer<typeof employeeFilterSchema>;
