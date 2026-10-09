import { z } from 'zod';

import { FORM_LIMITS, FORM_PATTERNS } from './limits';

const uuid = z.string().uuid('El identificador no es válido.');
const dateTime = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'La fecha no es válida.');
const decimal = z
  .string()
  .regex(FORM_PATTERNS.decimal6, 'Usa un importe decimal válido.')
  .refine((value) => Number(value) > 0, 'La cantidad debe ser mayor que cero.')
  .refine(
    (value) => Number(value) <= FORM_LIMITS.event.lineQuantityMax,
    'El importe supera el máximo permitido.',
  );
const decimal2 = z
  .string()
  .regex(FORM_PATTERNS.decimal2, 'Usa un importe con hasta dos decimales.')
  .refine(
    (value) => Number(value) <= FORM_LIMITS.event.linePriceMax,
    'El importe supera el máximo permitido.',
  );

const eventTypes = ['Wedding', 'Birthday', 'Corporate', 'Meeting', 'Anniversary', 'Other'] as const;
const eventStatuses = [
  'Inquiry',
  'Quoted',
  'Negotiating',
  'Tentative',
  'Confirmed',
  'InProgress',
  'Completed',
  'Cancelled',
  'Lost',
] as const;
const lineTypes = [
  'Menu',
  'Beverage',
  'Venue',
  'Decoration',
  'Staffing',
  'Service',
  'Other',
] as const;

export const eventSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  locationId: uuid,
  eventType: z.enum(eventTypes),
  title: z
    .string()
    .trim()
    .min(1, 'El título es obligatorio.')
    .max(FORM_LIMITS.event.titleMaxLength),
  contactName: z
    .string()
    .trim()
    .min(1, 'El contacto es obligatorio.')
    .max(FORM_LIMITS.event.contactNameMaxLength),
  contactPhone: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio.')
    .max(FORM_LIMITS.event.contactPhoneMaxLength),
  contactEmail: z
    .string()
    .trim()
    .max(FORM_LIMITS.event.contactEmailMaxLength)
    .optional()
    .or(z.literal('')),
  startsAt: dateTime,
  endsAt: dateTime,
  setupStartsAt: dateTime.optional().or(z.literal('')),
  estimatedGuestCount: z.coerce
    .number()
    .int()
    .min(FORM_LIMITS.event.estimatedGuestCountMin)
    .max(FORM_LIMITS.event.estimatedGuestCountMax),
  confirmedGuestCount: z.coerce
    .number()
    .int()
    .min(FORM_LIMITS.event.confirmedGuestCountMin)
    .optional()
    .or(z.literal('')),
  budgetTarget: decimal2.optional().or(z.literal('')),
  status: z.enum(eventStatuses),
  specialRequirements: z
    .string()
    .trim()
    .max(FORM_LIMITS.event.specialRequirementsMaxLength)
    .optional()
    .or(z.literal('')),
  internalNotes: z
    .string()
    .trim()
    .max(FORM_LIMITS.event.internalNotesMaxLength)
    .optional()
    .or(z.literal('')),
  preferredLanguage: z.enum(['es', 'en']),
});

export const spaceBookingSchema = z.object({
  eventId: uuid,
  venueSpaceId: uuid,
  startsAt: dateTime,
  endsAt: dateTime,
  setupStartsAt: dateTime.optional().or(z.literal('')),
  teardownEndsAt: dateTime.optional().or(z.literal('')),
  bookingStatus: z.enum(['Held', 'Confirmed', 'Released']),
  capacityReserved: z.coerce.number().int().min(FORM_LIMITS.venue.capacityMin),
  holdExpiresAt: dateTime.optional().or(z.literal('')),
});

export const packageLineSchema = z.object({
  lineType: z.enum(lineTypes),
  menuItemVariantId: uuid.optional().or(z.literal('')),
  labelEs: z.string().trim().min(1).max(FORM_LIMITS.event.lineLabelMaxLength),
  labelEn: z.string().trim().min(1).max(FORM_LIMITS.event.lineLabelMaxLength),
  quantity: decimal,
  unit: z.string().trim().min(1).max(FORM_LIMITS.event.lineUnitMaxLength),
  unitPrice: decimal2,
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const packageSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  locationId: uuid,
  packageCode: z.string().trim().min(1).max(FORM_LIMITS.event.packageCodeMaxLength),
  nameEs: z.string().trim().min(1).max(FORM_LIMITS.event.packageNameMaxLength),
  nameEn: z.string().trim().min(1).max(FORM_LIMITS.event.packageNameMaxLength),
  descriptionEs: z
    .string()
    .trim()
    .max(FORM_LIMITS.event.packageDescriptionMaxLength)
    .optional()
    .or(z.literal('')),
  descriptionEn: z
    .string()
    .trim()
    .max(FORM_LIMITS.event.packageDescriptionMaxLength)
    .optional()
    .or(z.literal('')),
  pricingModel: z.enum(['per_person', 'flat', 'hourly']),
  basePrice: decimal2,
  minGuestCount: z.coerce
    .number()
    .int()
    .min(FORM_LIMITS.event.packageGuestCountMin)
    .optional()
    .or(z.literal('')),
  maxGuestCount: z.coerce
    .number()
    .int()
    .min(FORM_LIMITS.event.packageGuestCountMin)
    .optional()
    .or(z.literal('')),
  active: z.boolean(),
  lines: z.array(packageLineSchema).default([]),
});

export const quoteLineSchema = z.object({
  eventPackageLineId: uuid.optional().or(z.literal('')),
  menuItemVariantId: uuid.optional().or(z.literal('')),
  lineType: z.enum(lineTypes),
  labelEs: z.string().trim().min(1).max(FORM_LIMITS.event.lineLabelMaxLength),
  labelEn: z.string().trim().min(1).max(FORM_LIMITS.event.lineLabelMaxLength),
  quantity: decimal,
  unit: z.string().trim().min(1).max(FORM_LIMITS.event.lineUnitMaxLength),
  unitPrice: decimal2,
  discountAmount: decimal2.default('0'),
  taxRate: z
    .string()
    .regex(FORM_PATTERNS.decimal6, 'La tasa no es válida.')
    .refine(
      (value) =>
        Number(value) >= FORM_LIMITS.event.taxRateMin &&
        Number(value) <= FORM_LIMITS.event.taxRateMax,
      'La tasa debe estar entre 0 y 1.',
    )
    .default('0'),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const quoteSchema = z.object({
  eventId: uuid,
  eventPackageId: uuid.optional().or(z.literal('')),
  validUntil: z.string().date('La fecha de vigencia no es válida.'),
  termsEs: z.string().trim().max(10_000).optional().or(z.literal('')),
  termsEn: z.string().trim().max(10_000).optional().or(z.literal('')),
  lines: z.array(quoteLineSchema).min(1, 'La cotización requiere al menos una línea.'),
});

export const quoteStatusSchema = z.object({
  quoteId: uuid,
  status: z.enum(['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired', 'Cancelled']),
});

export const requirementSchema = z.object({
  eventId: uuid,
  requirementType: z.enum(['allergy', 'diet', 'accessibility', 'equipment', 'schedule', 'other']),
  description: z.string().trim().min(1).max(FORM_LIMITS.event.descriptionMaxLength),
  guestCount: z.coerce
    .number()
    .int()
    .min(FORM_LIMITS.event.requirementGuestCountMin)
    .optional()
    .or(z.literal('')),
  severity: z.enum(['informational', 'important', 'critical']),
  status: z.enum(['open', 'acknowledged', 'resolved']),
});

export const updateRequirementSchema = z.object({
  requirementId: uuid,
  description: z.string().trim().min(1).max(FORM_LIMITS.event.descriptionMaxLength),
  guestCount: z.coerce
    .number()
    .int()
    .min(FORM_LIMITS.event.requirementGuestCountMin)
    .optional()
    .or(z.literal('')),
  severity: z.enum(['informational', 'important', 'critical']),
  status: z.enum(['open', 'acknowledged', 'resolved']),
  resolvedAt: dateTime.optional().or(z.literal('')),
});

export function validationMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}
