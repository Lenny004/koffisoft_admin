import { z } from 'zod';

const optionalText = z.string().trim().optional();

export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'El slug es obligatorio.')
    .max(120, 'El slug no puede superar 120 caracteres.')
    .regex(/^[a-z0-9-]+$/u, 'Usa minúsculas, números y guiones en el slug.'),
  nameEs: z.string().trim().min(1, 'El nombre en español es obligatorio.').max(120),
  nameEn: z.string().trim().min(1, 'El nombre en inglés es obligatorio.').max(120),
  descriptionEs: optionalText,
  descriptionEn: optionalText,
  displayOrder: z.coerce.number().int().min(0),
  active: z.boolean(),
});

export const categoryReorderSchema = z.object({
  categories: z
    .array(z.object({ id: z.string().uuid(), displayOrder: z.coerce.number().int().min(0) }))
    .min(1, 'Debes enviar al menos una categoría.'),
});

const itemTypes = ['Food', 'Beverage', 'Dessert', 'Service'] as const;

export const itemSchema = z.object({
  categoryId: z.string().uuid('Selecciona una categoría.'),
  sku: z.string().trim().min(1, 'El SKU es obligatorio.').max(50),
  slug: z
    .string()
    .trim()
    .min(1, 'El slug es obligatorio.')
    .max(160)
    .regex(/^[a-z0-9-]+$/u, 'Usa minúsculas, números y guiones en el slug.'),
  itemType: z.enum(itemTypes),
  nameEs: z.string().trim().min(1, 'El nombre en español es obligatorio.').max(160),
  nameEn: z.string().trim().min(1, 'El nombre en inglés es obligatorio.').max(160),
  descriptionEs: optionalText,
  descriptionEn: optionalText,
  publicVisible: z.boolean(),
  active: z.boolean(),
});

export const priceSchema = z.object({
  variantId: z.string().uuid('Selecciona una variante.'),
  locationId: z.string().uuid('La sede no es válida.'),
  channel: z.enum(['Pos', 'Web', 'Event', 'Takeaway']),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo.'),
  taxRateId: z.string().uuid('El impuesto no es válido.'),
  validFrom: z.string().date('La fecha inicial no es válida.'),
  validTo: z.string().date().optional().or(z.literal('')),
  includesTax: z.boolean(),
});

export const allergenSchema = z.object({
  variantId: z.string().uuid('Selecciona una variante.'),
  allergens: z.array(
    z.object({
      allergenId: z.string().uuid('El alérgeno no es válido.'),
      presenceType: z.enum(['contains', 'may_contain']),
      isReviewed: z.boolean(),
    }),
  ),
});

export const availabilitySchema = z.object({
  variantId: z.string().uuid('Selecciona una variante.'),
  locationId: z.string().uuid('La sede no es válida.'),
  channel: z.enum(['Pos', 'Web', 'Event', 'Takeaway']),
  dayOfWeek: z.coerce.number().int().min(1).max(7),
  startsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u, 'Usa HH:mm.'),
  endsAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u, 'Usa HH:mm.'),
  crossesMidnight: z.boolean(),
  validFrom: z.string().date().optional().or(z.literal('')),
  validTo: z.string().date().optional().or(z.literal('')),
});

export function formBoolean(value: FormDataEntryValue | null, defaultValue = false): boolean {
  if (value === null) return defaultValue;
  return value === 'true' || value === 'on';
}

export function formText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value : '';
}

export function validationMessages(result: z.ZodError): string[] {
  return result.issues.map((issue) => issue.message);
}
