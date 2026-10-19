/**
 * Validación de overrides SEO (rutas, títulos y descripciones).
 */
import { z } from 'zod';

import { FORM_LIMITS, FORM_PATTERNS } from './limits';

const uuid = z.string().uuid('El identificador no es valido.');
const resourceType = z.enum(['menu_item', 'event', 'announcement', 'page']);

export const seoSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  resourceType,
  resourceKey: z
    .string()
    .trim()
    .min(1, 'La clave del recurso es obligatoria.')
    .max(FORM_LIMITS.seo.resourceKeyMaxLength)
    .regex(FORM_PATTERNS.seoKey, 'Usa letras, numeros, guiones o barras.'),
  metaTitle: z
    .string()
    .trim()
    .min(1, 'El meta titulo es obligatorio.')
    .max(FORM_LIMITS.seo.metaTitleMaxLength),
  metaDescription: z
    .string()
    .trim()
    .min(1, 'La meta descripcion es obligatoria.')
    .max(FORM_LIMITS.seo.metaDescriptionMaxLength),
  ogImageUrl: z
    .string()
    .trim()
    .refine((value) => !value || FORM_PATTERNS.httpUrl.test(value), 'Usa una URL HTTP(S) segura.')
    .max(FORM_LIMITS.seo.urlMaxLength),
  canonicalUrl: z
    .string()
    .trim()
    .refine((value) => !value || FORM_PATTERNS.httpUrl.test(value), 'Usa una URL HTTP(S) segura.')
    .max(FORM_LIMITS.seo.urlMaxLength),
  noindex: z.boolean(),
});
