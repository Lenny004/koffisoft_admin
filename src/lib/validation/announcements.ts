import { z } from 'zod';

import { FORM_LIMITS } from './limits';

/** Texto opcional recortado; las cadenas vacías se omiten del payload validado. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional();

/** Rechaza rutas protocol-relative y URLs fuera de HTTP(S) o rutas internas seguras. */
function isSafeAnnouncementUrl(value: string): boolean {
  if (/[\u0000-\u001f\u007f\\]/u.test(value)) {
    return false;
  }
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) && /^https?:\/\//iu.test(value);
  } catch {
    return false;
  }
}

export const announcementSchema = z
  .object({
    id: z.string().optional(),
    title: z
      .string()
      .trim()
      .min(1, 'El título es obligatorio.')
      .max(FORM_LIMITS.announcement.titleMaxLength),
    message: z
      .string()
      .trim()
      .min(1, 'El mensaje es obligatorio.')
      .max(FORM_LIMITS.announcement.messageMaxLength),
    ctaLabel: optionalText(FORM_LIMITS.announcement.ctaLabelMaxLength),
    ctaUrl: optionalText(FORM_LIMITS.announcement.ctaUrlMaxLength).refine(
      (value) => value === undefined || isSafeAnnouncementUrl(value),
      'Usa una URL HTTP(S) o una ruta relativa segura.',
    ),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    displayOrder: z.coerce.number().int().min(0).max(FORM_LIMITS.announcement.displayOrderMax),
    active: z.boolean(),
  })
  .superRefine((value, context) => {
    if (!value.startsAt || !value.endsAt) return;
    const starts = new Date(value.startsAt);
    const ends = new Date(value.endsAt);
    if (Number.isNaN(starts.getTime()) || Number.isNaN(ends.getTime()) || ends <= starts) {
      context.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'Debe ser posterior al inicio.',
      });
    }
  });
