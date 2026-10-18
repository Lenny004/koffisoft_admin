import { z } from 'zod';

import { FORM_LIMITS } from './limits';

export const auditLogFilterSchema = z.object({
  page: z.coerce.number().int().min(FORM_LIMITS.pagination.pageMin).default(1),
  actorUserId: z.string().uuid('Selecciona un usuario válido.').optional().or(z.literal('')),
  action: z.string().trim().max(FORM_LIMITS.auditLog.searchMaxLength).default(''),
  entityType: z.string().trim().max(FORM_LIMITS.auditLog.searchMaxLength).default(''),
  dateFrom: z.string().date('La fecha inicial no es válida.').optional().or(z.literal('')),
  dateTo: z.string().date('La fecha final no es válida.').optional().or(z.literal('')),
});
