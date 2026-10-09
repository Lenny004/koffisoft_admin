import type { ZodError } from 'zod';

/** Convierte las rutas de Zod en mensajes serializables que cada campo puede mostrar. */
export type FieldErrors = Record<string, string>;

export function validationErrors(error: ZodError): FieldErrors {
  return error.issues.reduce<FieldErrors>((errors, issue) => {
    const field = issue.path.length > 0 ? issue.path.join('.') : '_form';
    if (!errors[field]) errors[field] = issue.message;
    return errors;
  }, {});
}

export function validationMessages(errors: FieldErrors): string[] {
  return Object.entries(errors)
    .filter(([field]) => field === '_form')
    .map(([, message]) => message);
}

export function formValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => !/(password|token|secret|code)/i.test(key))
      .map(([key, value]) => [key, typeof value === 'string' ? value : '']),
  );
}
