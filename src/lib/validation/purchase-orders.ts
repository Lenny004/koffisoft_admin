import { z } from 'zod';

import { PURCHASE_ORDER_STATUSES } from '$lib/purchase-orders/types';
import { FORM_LIMITS, FORM_PATTERNS } from './limits';

const uuid = z.string().uuid('Selecciona un registro válido.');
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));
const positiveAmount = z
  .string()
  .trim()
  .regex(FORM_PATTERNS.decimal6, 'Usa un número con hasta 6 decimales.')
  .refine((value) => Number(value) > 0, 'Debe ser mayor que cero.')
  .refine(
    (value) => Number(value) <= FORM_LIMITS.inventory.decimalMax,
    'El valor es demasiado grande.',
  );

export const purchaseOrderFilterSchema = z.object({
  page: z.coerce.number().int().min(FORM_LIMITS.pagination.pageMin).default(1),
  status: z.enum(PURCHASE_ORDER_STATUSES).or(z.literal('')).default(''),
  supplierId: uuid.optional().or(z.literal('')).default(''),
});

export const purchaseOrderLineSchema = z.object({
  ingredientId: uuid,
  unitId: uuid,
  quantityOrdered: positiveAmount,
  unitCost: positiveAmount,
});

export const purchaseOrderCreateSchema = z.object({
  locationId: uuid,
  supplierId: uuid,
  orderDate: z.string().date('La fecha de la orden no es válida.'),
  expectedDelivery: z
    .string()
    .date('La fecha de entrega no es válida.')
    .optional()
    .or(z.literal('')),
  notes: optionalText(FORM_LIMITS.inventory.notesMaxLength),
  lines: z
    .array(purchaseOrderLineSchema)
    .min(1, 'Agrega al menos una línea.')
    .max(FORM_LIMITS.inventory.purchaseOrderLinesMaxSize),
});

export const purchaseOrderUpdateSchema = z.object({
  id: uuid,
  expectedDelivery: z
    .string()
    .date('La fecha de entrega no es válida.')
    .optional()
    .or(z.literal('')),
  notes: optionalText(FORM_LIMITS.inventory.notesMaxLength),
});

export const purchaseOrderIdSchema = z.object({
  id: uuid,
});

export const receivePurchaseOrderSchema = z.object({
  id: uuid,
  storageLocationId: uuid,
  notes: optionalText(FORM_LIMITS.inventory.notesMaxLength),
  lines: z
    .array(
      z.object({
        lineId: uuid,
        quantityReceived: positiveAmount,
        lotCode: z
          .string()
          .trim()
          .min(1, 'El lote es obligatorio.')
          .max(FORM_LIMITS.inventory.lotCodeMaxLength),
        expiresOn: z
          .string()
          .date('La fecha de vencimiento no es válida.')
          .optional()
          .or(z.literal('')),
      }),
    )
    .min(1, 'Agrega al menos una línea de recepción.')
    .max(FORM_LIMITS.inventory.purchaseOrderLinesMaxSize),
});
