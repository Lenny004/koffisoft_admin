import { z } from 'zod';

import { FORM_LIMITS } from './limits';

export const auditLogFilterSchema = z.object({
  page: z.coerce.number().int().min(FORM_LIMITS.pagination.pageMin).default(1),
  actorUserId: z
    .union([z.string().uuid('Selecciona un usuario válido.'), z.literal('')])
    .default(''),
  action: z.string().trim().max(FORM_LIMITS.auditLog.searchMaxLength).default(''),
  entityType: z.string().trim().max(FORM_LIMITS.auditLog.searchMaxLength).default(''),
  dateFrom: z.union([z.string().date('La fecha inicial no es válida.'), z.literal('')]).default(''),
  dateTo: z.union([z.string().date('La fecha final no es válida.'), z.literal('')]).default(''),
});
