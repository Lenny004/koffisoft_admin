import { z } from 'zod';

import { FORM_LIMITS, FORM_PATTERNS } from './limits';

/** Texto opcional recortado sin convertir vacíos en undefined (contrato de menú). */
const optionalText = (maxLength: number) => z.string().trim().max(maxLength).optional();

export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'El slug es obligatorio.')
    .max(FORM_LIMITS.menu.categorySlugMaxLength, 'El slug no puede superar 120 caracteres.')
    .regex(FORM_PATTERNS.slug, 'Usa minúsculas, números y guiones en el slug.'),
  nameEs: z
    .string()
    .trim()
    .min(1, 'El nombre en español es obligatorio.')
    .max(FORM_LIMITS.menu.categoryNameMaxLength),
  nameEn: z
    .string()
    .trim()
    .min(1, 'El nombre en inglés es obligatorio.')
    .max(FORM_LIMITS.menu.categoryNameMaxLength),
  descriptionEs: optionalText(FORM_LIMITS.menu.categoryDescriptionMaxLength),
  descriptionEn: optionalText(FORM_LIMITS.menu.categoryDescriptionMaxLength),
  displayOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const categoryReorderSchema = z.object({
  categories: z
    .array(z.object({ id: z.string().uuid(), displayOrder: z.coerce.number().int().min(0) }))
    .min(1, 'Debes enviar al menos una categoría.')
    .max(FORM_LIMITS.menu.categoryReorderMaxSize),
});

const itemTypes = ['Food', 'Beverage', 'Dessert', 'Service'] as const;

export const itemSchema = z.object({
  categoryId: z.string().uuid('Selecciona una categoría.'),
  sku: z.string().trim().min(1, 'El SKU es obligatorio.').max(FORM_LIMITS.menu.productSkuMaxLength),
  slug: z
    .string()
    .trim()
    .min(1, 'El slug es obligatorio.')
    .max(FORM_LIMITS.menu.productSlugMaxLength)
    .regex(FORM_PATTERNS.slug, 'Usa minúsculas, números y guiones en el slug.'),
  itemType: z.enum(itemTypes),
  nameEs: z
    .string()
    .trim()
    .min(1, 'El nombre en español es obligatorio.')
    .max(FORM_LIMITS.menu.productNameMaxLength),
  nameEn: z
    .string()
    .trim()
    .min(1, 'El nombre en inglés es obligatorio.')
    .max(FORM_LIMITS.menu.productNameMaxLength),
  descriptionEs: optionalText(FORM_LIMITS.menu.productDescriptionMaxLength),
  descriptionEn: optionalText(FORM_LIMITS.menu.productDescriptionMaxLength),
  publicVisible: z.boolean(),
  active: z.boolean(),
});

export const priceSchema = z.object({
  variantId: z.string().uuid('Selecciona una variante.'),
  locationId: z.string().uuid('La sede no es válida.'),
  channel: z.enum(['Pos', 'Web', 'Event', 'Takeaway']),
  price: z.coerce
    .number()
    .min(FORM_LIMITS.menu.priceMin, 'El precio no puede ser negativo.')
    .max(FORM_LIMITS.menu.priceMax, 'El precio supera el máximo permitido.'),
  taxRateId: z.string().uuid('El impuesto no es válido.'),
  validFrom: z.string().date('La fecha inicial no es válida.'),
  validTo: z.string().date().optional().or(z.literal('')),
  includesTax: z.boolean(),
});

export const allergenSchema = z.object({
  variantId: z.string().uuid('Selecciona una variante.'),
  allergens: z
    .array(
      z.object({
        allergenId: z.string().uuid('El alérgeno no es válido.'),
        presenceType: z.enum(['contains', 'may_contain']),
        isReviewed: z.boolean(),
      }),
    )
    .max(FORM_LIMITS.menu.allergenMaxSize),
});

export const availabilitySchema = z.object({
  variantId: z.string().uuid('Selecciona una variante.'),
  locationId: z.string().uuid('La sede no es válida.'),
  channel: z.enum(['Pos', 'Web', 'Event', 'Takeaway']),
  dayOfWeek: z.coerce
    .number()
    .int()
    .min(FORM_LIMITS.menu.dayOfWeekMin)
    .max(FORM_LIMITS.menu.dayOfWeekMax),
  startsAt: z.string().regex(FORM_PATTERNS.time, 'Usa HH:mm.'),
  endsAt: z.string().regex(FORM_PATTERNS.time, 'Usa HH:mm.'),
  crossesMidnight: z.boolean(),
  validFrom: z.string().date().optional().or(z.literal('')),
  validTo: z.string().date().optional().or(z.literal('')),
});

/** Interpreta checkboxes HTML (`on`/`true`) cuando el campo no llega en el FormData. */
export function formBoolean(value: FormDataEntryValue | null, defaultValue = false): boolean {
  if (value === null) return defaultValue;
  return value === 'true' || value === 'on';
}

/** Coerce un valor de FormData a cadena, ignorando entradas no textuales. */
export function formText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value : '';
}

/** Lista plana de mensajes de Zod para resúmenes de error en formularios de menú. */
export function validationMessages(result: z.ZodError): string[] {
  return result.issues.map((issue) => issue.message);
}
