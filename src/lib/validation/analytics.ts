/**
 * Esquemas Zod de filtros de fechas y sede en estadísticas.
 */
import { z } from 'zod';

import { FORM_LIMITS } from './limits';

const date = z.string().date('Usa una fecha válida.');

export const analyticsFilterSchema = z
  .object({
    locationId: z.string().uuid('Selecciona una sede válida.'),
    from: date,
    to: date,
  })
  .refine(({ from, to }) => from <= to, {
    message: 'La fecha inicial debe ser anterior o igual a la final.',
    path: ['from'],
  })
  .refine(
    ({ from, to }) =>
      Math.floor((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) +
        1 <=
      FORM_LIMITS.analytics.reportRangeMaxDays,
    {
      message: `El rango no puede superar ${FORM_LIMITS.analytics.reportRangeMaxDays} días.`,
      path: ['to'],
    },
  );

export type AnalyticsFilterValues = z.infer<typeof analyticsFilterSchema>;
