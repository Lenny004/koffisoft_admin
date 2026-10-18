import { z } from 'zod';

import { RESOURCE_CATEGORIES, RESOURCE_STATUSES } from '$lib/resources/types';
import { FORM_LIMITS, FORM_PATTERNS } from './limits';

const uuid = z.string().uuid('Selecciona un registro válido.');
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));

export const resourceFilterSchema = z.object({
  page: z.coerce.number().int().min(FORM_LIMITS.pagination.pageMin).default(1),
  search: z.string().trim().max(FORM_LIMITS.inventory.searchMaxLength).default(''),
  category: z.enum(RESOURCE_CATEGORIES).or(z.literal('')).default(''),
  status: z.enum(RESOURCE_STATUSES).or(z.literal('')).default(''),
});

export const resourceSchema = z.object({
  id: uuid.optional().or(z.literal('')),
  locationId: uuid,
  resourceCode: z
    .string()
    .trim()
    .min(1, 'El código del recurso es obligatorio.')
    .max(FORM_LIMITS.inventory.resourceCodeMaxLength),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre del recurso es obligatorio.')
    .max(FORM_LIMITS.inventory.resourceNameMaxLength),
  category: z.enum(RESOURCE_CATEGORIES, { message: 'Selecciona una categoría válida.' }),
  location: optionalText(FORM_LIMITS.inventory.resourceLocationMaxLength),
  status: z.enum(RESOURCE_STATUSES, { message: 'Selecciona un estado válido.' }),
  purchaseDate: z.string().date('La fecha de compra no es válida.').optional().or(z.literal('')),
  cost: z
    .string()
    .trim()
    .regex(FORM_PATTERNS.decimal2, 'Usa un número con hasta 2 decimales.')
    .optional()
    .or(z.literal('')),
  supplierId: uuid.optional().or(z.literal('')),
  notes: optionalText(FORM_LIMITS.inventory.notesMaxLength),
  active: z.boolean().default(true),
});

export const maintenanceSchema = z.object({
  resourceId: uuid,
  scheduledDate: z.string().date('La fecha programada no es válida.'),
  description: z
    .string()
    .trim()
    .min(1, 'La descripción es obligatoria.')
    .max(FORM_LIMITS.inventory.maintenanceDescriptionMaxLength),
  notes: optionalText(FORM_LIMITS.inventory.notesMaxLength),
});

export const completeMaintenanceSchema = z.object({
  id: uuid,
  notes: optionalText(FORM_LIMITS.inventory.notesMaxLength),
});
