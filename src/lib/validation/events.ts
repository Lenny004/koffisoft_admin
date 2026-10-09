import { z } from 'zod';

const uuid = z.string().uuid('El identificador no es válido.');
const dateTime = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'La fecha no es válida.');
const decimal = z.string().regex(/^\d+(\.\d{1,6})?$/u, 'Usa un importe decimal válido.');

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
  title: z.string().trim().min(1, 'El título es obligatorio.').max(200),
  contactName: z.string().trim().min(1, 'El contacto es obligatorio.').max(200),
  contactPhone: z.string().trim().min(1, 'El teléfono es obligatorio.').max(40),
  contactEmail: z.string().trim().max(200).optional().or(z.literal('')),
  startsAt: dateTime,
  endsAt: dateTime,
  setupStartsAt: dateTime.optional().or(z.literal('')),
  estimatedGuestCount: z.coerce.number().int().min(1).max(10_000),
  confirmedGuestCount: z.coerce.number().int().min(1).optional().or(z.literal('')),
  budgetTarget: decimal.optional().or(z.literal('')),
  status: z.enum(eventStatuses),
  specialRequirements: z.string().trim().max(10_000).optional().or(z.literal('')),
  internalNotes: z.string().trim().max(10_000).optional().or(z.literal('')),
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
  capacityReserved: z.coerce.number().int().min(1),
  holdExpiresAt: dateTime.optional().or(z.literal('')),
});

export const packageLineSchema = z.object({
  lineType: z.enum(lineTypes),
  menuItemVariantId: uuid.optional().or(z.literal('')),
  labelEs: z.string().trim().min(1).max(200),
  labelEn: z.string().trim().min(1).max(200),
  quantity: decimal,
  unit: z.string().trim().min(1).max(40),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/u, 'El precio no es válido.'),
  sortOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const packageSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  locationId: uuid,
  packageCode: z.string().trim().min(1).max(50),
  nameEs: z.string().trim().min(1).max(160),
  nameEn: z.string().trim().min(1).max(160),
  descriptionEs: z.string().trim().max(10_000).optional().or(z.literal('')),
  descriptionEn: z.string().trim().max(10_000).optional().or(z.literal('')),
  pricingModel: z.enum(['per_person', 'flat', 'hourly']),
  basePrice: z.string().regex(/^\d+(\.\d{1,2})?$/u, 'El precio base no es válido.'),
  minGuestCount: z.coerce.number().int().min(1).optional().or(z.literal('')),
  maxGuestCount: z.coerce.number().int().min(1).optional().or(z.literal('')),
  active: z.boolean(),
  lines: z.array(packageLineSchema).default([]),
});

export const quoteLineSchema = z.object({
  eventPackageLineId: uuid.optional().or(z.literal('')),
  menuItemVariantId: uuid.optional().or(z.literal('')),
  lineType: z.enum(lineTypes),
  labelEs: z.string().trim().min(1).max(200),
  labelEn: z.string().trim().min(1).max(200),
  quantity: decimal,
  unit: z.string().trim().min(1).max(40),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/u, 'El precio no es válido.'),
  discountAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/u, 'El descuento no es válido.')
    .default('0'),
  taxRate: decimal.default('0'),
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
  description: z.string().trim().min(1).max(10_000),
  guestCount: z.coerce.number().int().min(1).optional().or(z.literal('')),
  severity: z.enum(['informational', 'important', 'critical']),
  status: z.enum(['open', 'acknowledged', 'resolved']),
});

export const updateRequirementSchema = z.object({
  requirementId: uuid,
  description: z.string().trim().min(1).max(10_000),
  guestCount: z.coerce.number().int().min(1).optional().or(z.literal('')),
  severity: z.enum(['informational', 'important', 'critical']),
  status: z.enum(['open', 'acknowledged', 'resolved']),
  resolvedAt: dateTime.optional().or(z.literal('')),
});

export function validationMessages(error: z.ZodError): string[] {
  return error.issues.map((issue) => issue.message);
}
