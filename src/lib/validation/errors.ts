import type { ZodError } from 'zod';

/** Convierte las rutas de Zod en mensajes serializables que cada campo puede mostrar. */
export type FieldErrors = Record<string, string>;
export type FormErrors = FieldErrors | string[];

/** Obtiene el mensaje de un campo sin repetir el estrechamiento del resultado de una action. */
export function fieldError(errors: FormErrors | undefined, field: string): string {
  if (!errors || Array.isArray(errors)) return '';
  return errors[field] ?? '';
}

/** Conserva los errores generales y los errores serializados como lista. */
export function globalErrors(errors: FormErrors | undefined): string[] {
  if (!errors) return [];
  if (Array.isArray(errors)) return errors;
  return errors._form ? [errors._form] : [];
}

/** Agrupa los issues de Zod por ruta de campo, conservando un mensaje por clave. */
export function validationErrors(error: ZodError): FieldErrors {
  return error.issues.reduce<FieldErrors>((errors, issue) => {
    const field = issue.path.length > 0 ? issue.path.join('.') : '_form';
    if (!errors[field]) errors[field] = issue.message;
    return errors;
  }, {});
}

/** Extrae solo los errores de formulario general serializados bajo `_form`. */
export function validationMessages(errors: FieldErrors): string[] {
  return Object.entries(errors)
    .filter(([field]) => field === '_form')
    .map(([, message]) => message);
}

/** Parsea un campo JSON oculto del formulario y devuelve error de validación si el JSON es inválido. */
export function jsonFormValue<T>(
  formData: FormData,
  name: string,
  message: string,
): { value?: T; error?: string } {
  const raw = formData.get(name);
  if (typeof raw !== 'string' || raw.trim() === '') return { value: [] as T };
  try {
    return { value: JSON.parse(raw) as T };
  } catch {
    return { error: message };
  }
}

/** Snapshot de valores reenviables excluyendo credenciales y tokens sensibles. */
export function formValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    Array.from(formData.entries())
      .filter(([key]) => !/(password|token|secret|code)/i.test(key))
      .map(([key, value]) => [key, typeof value === 'string' ? value : '']),
  );
}
