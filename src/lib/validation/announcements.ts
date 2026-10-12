import { z } from 'zod';

import { FORM_LIMITS } from './limits';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional();

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
    ctaUrl: optionalText(FORM_LIMITS.announcement.ctaUrlMaxLength),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    displayOrder: z.coerce.number().int().min(0).max(100_000),
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
