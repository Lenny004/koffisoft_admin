/**
 * Validación de actualización y conversión de mensajes de contacto.
 */
import { z } from 'zod';

import { FORM_LIMITS, FORM_PATTERNS } from './limits';

const uuid = z.string().uuid('El identificador no es válido.');

export const contactFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().max(FORM_LIMITS.contact.searchMaxLength).default(''),
  status: z.enum(['New', 'InProgress', 'Replied', 'Closed', 'Spam']).optional().or(z.literal('')),
  includeArchived: z.coerce.boolean().default(false),
});

export const contactUpdateSchema = z.object({
  id: uuid,
  status: z.enum(['New', 'InProgress', 'Replied', 'Closed', 'Spam']),
  assignedToUserId: uuid.optional().or(z.literal('')),
  archived: z.enum(['true', 'false']).transform((value) => value === 'true'),
});

export const contactReservationConversionSchema = z.object({
  contactPhone: z
    .string()
    .trim()
    .min(1, 'El telefono es obligatorio.')
    .max(FORM_LIMITS.reservation.contactPhoneMaxLength),
  id: uuid,
  date: z.string().date('Usa una fecha válida.'),
  time: z.string().regex(FORM_PATTERNS.time, 'Usa una hora válida.'),
  partySize: z.coerce
    .number()
    .int()
    .min(FORM_LIMITS.reservation.partySizeMin)
    .max(FORM_LIMITS.reservation.partySizeMax),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(FORM_LIMITS.reservation.durationMinutesMin)
    .max(FORM_LIMITS.reservation.durationMinutesMax),
  preferredSpaceId: uuid.optional().or(z.literal('')),
});

export const contactEventConversionSchema = z.object({
  id: uuid,
  eventType: z.enum(['Wedding', 'Birthday', 'Corporate', 'Meeting', 'Anniversary', 'Other']),
  title: z
    .string()
    .trim()
    .min(1, 'El título es obligatorio.')
    .max(FORM_LIMITS.event.titleMaxLength),
  startsAt: z.string().datetime({ local: true }),
  endsAt: z.string().datetime({ local: true }),
  estimatedGuestCount: z.coerce
    .number()
    .int()
    .min(FORM_LIMITS.event.estimatedGuestCountMin)
    .max(FORM_LIMITS.event.estimatedGuestCountMax),
  budgetTarget: z
    .string()
    .trim()
    .regex(FORM_PATTERNS.decimal2, 'Usa un monto con hasta dos decimales.')
    .optional()
    .or(z.literal('')),
});
