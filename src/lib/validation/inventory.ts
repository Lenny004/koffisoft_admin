import { z } from 'zod';

import { FORM_LIMITS, FORM_PATTERNS } from './limits';

const uuid = z.string().uuid('Selecciona un registro válido.');
const decimal = z
  .string()
  .regex(FORM_PATTERNS.decimal6, 'Usa un número con hasta 6 decimales.')
  .refine(
    (value) => Number(value) <= FORM_LIMITS.inventory.decimalMax,
    'El valor es demasiado grande.',
  );
const positiveDecimal = decimal.refine((value) => Number(value) > 0, 'Debe ser mayor que cero.');
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));

export const inventoryFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().max(FORM_LIMITS.inventory.searchMaxLength).default(''),
  storageLocationId: uuid.optional().or(z.literal('')).default(''),
  movementPage: z.coerce.number().int().min(1).default(1),
  ingredientId: uuid.optional().or(z.literal('')).default(''),
  movementType: z
    .enum(['', 'receipt', 'sale_consumption', 'waste', 'adjustment_in', 'adjustment_out'])
    .default(''),
  dateFrom: z.string().date().optional().or(z.literal('')).default(''),
  dateTo: z.string().date().optional().or(z.literal('')).default(''),
  expiryDays: z.coerce
    .number()
    .int()
    .min(FORM_LIMITS.inventory.expiryDaysMin)
    .max(FORM_LIMITS.inventory.expiryDaysMax)
    .default(30),
});

export const supplierFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().max(FORM_LIMITS.inventory.searchMaxLength).default(''),
});

const supplierFields = {
  supplierCode: z
    .string()
    .trim()
    .min(1, 'El código del proveedor es obligatorio.')
    .max(FORM_LIMITS.inventory.supplierCodeMaxLength),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre del proveedor es obligatorio.')
    .max(FORM_LIMITS.inventory.supplierNameMaxLength),
  taxId: optionalText(FORM_LIMITS.inventory.supplierTaxIdMaxLength),
  phone: optionalText(FORM_LIMITS.inventory.supplierPhoneMaxLength),
  email: z
    .union([
      z
        .string()
        .trim()
        .email('Escribe un correo electrónico válido.')
        .max(FORM_LIMITS.inventory.supplierEmailMaxLength),
      z.literal(''),
    ])
    .default(''),
  addressLine: optionalText(FORM_LIMITS.inventory.supplierAddressMaxLength),
  deliveryDays: z
    .union([
      z.coerce
        .number()
        .int()
        .min(FORM_LIMITS.inventory.deliveryDaysMin)
        .max(FORM_LIMITS.inventory.deliveryDaysMax),
      z.literal(''),
    ])
    .default(''),
  orderReminderDays: z
    .union([
      z.coerce
        .number()
        .int()
        .min(FORM_LIMITS.inventory.orderReminderDaysMin)
        .max(FORM_LIMITS.inventory.orderReminderDaysMax),
      z.literal(''),
    ])
    .default(''),
  notes: optionalText(FORM_LIMITS.inventory.notesMaxLength),
  active: z.boolean().default(true),
};

export const supplierSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  locationId: uuid,
  ...supplierFields,
});

export const ingredientSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  locationId: uuid,
  categoryId: uuid,
  baseUnitId: uuid,
  sku: z
    .string()
    .trim()
    .min(1, 'El SKU es obligatorio.')
    .max(FORM_LIMITS.inventory.ingredientSkuMaxLength),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(FORM_LIMITS.inventory.ingredientNameMaxLength),
  description: optionalText(FORM_LIMITS.inventory.ingredientDescriptionMaxLength),
  reorderLevel: decimal,
  trackLots: z.boolean().default(true),
  active: z.boolean().default(true),
  supplierLinks: z
    .array(
      z.object({
        supplierId: uuid,
        supplierSku: optionalText(FORM_LIMITS.inventory.supplierSkuMaxLength),
        packQuantity: positiveDecimal,
        packUnitId: uuid,
        unitCost: decimal,
        isPreferred: z.boolean().default(false),
      }),
    )
    .max(FORM_LIMITS.inventory.supplierLinksMaxSize)
    .default([]),
});

const receiptLineSchema = z.object({
  ingredientId: uuid,
  unitId: uuid,
  lotCode: z
    .string()
    .trim()
    .min(1, 'El lote es obligatorio.')
    .max(FORM_LIMITS.inventory.lotCodeMaxLength),
  receivedOn: z.string().date('La fecha de recepción no es válida.'),
  expiresOn: z.string().date('La fecha de vencimiento no es válida.').optional().or(z.literal('')),
  quantityReceived: positiveDecimal,
  unitCost: decimal,
});

export const receiptSchema = z.object({
  locationId: uuid,
  supplierId: uuid,
  receiptNumber: z
    .string()
    .trim()
    .min(1, 'El número de recepción es obligatorio.')
    .max(FORM_LIMITS.inventory.receiptNumberMaxLength),
  receivedAt: z.string().datetime({ offset: true }),
  storageLocationId: uuid,
  notes: optionalText(FORM_LIMITS.inventory.notesMaxLength),
  lines: z
    .array(receiptLineSchema)
    .min(1, 'Agrega al menos una línea de recepción.')
    .max(FORM_LIMITS.inventory.receiptLinesMaxSize),
});

export const adjustmentSchema = z.object({
  operationId: uuid.optional().or(z.literal('')),
  locationId: uuid,
  storageLocationId: uuid,
  ingredientId: uuid,
  inventoryLotId: uuid.optional().or(z.literal('')),
  movementType: z.enum(['adjustment_in', 'adjustment_out', 'waste']),
  quantity: positiveDecimal,
  unitCost: decimal,
  reason: z
    .string()
    .trim()
    .min(FORM_LIMITS.inventory.reasonMinLength)
    .max(FORM_LIMITS.inventory.reasonMaxLength),
});

export type InventoryFilterValues = z.infer<typeof inventoryFilterSchema>;
