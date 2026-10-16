import { z } from 'zod';

const resourceTypes = ['announcement', 'event', 'menu_item'] as const;
const actions = ['draft', 'schedule', 'publish', 'unpublish'] as const;

export const publicationSchema = z
  .object({
    resourceType: z.enum(resourceTypes),
    resourceId: z.string().uuid('El contenido seleccionado no es válido.'),
    action: z.enum(actions),
    scheduledAt: z.string().optional(),
    expiresAt: z.string().optional(),
  })
  .superRefine((value, context) => {
    const scheduledAt = value.scheduledAt ? new Date(value.scheduledAt) : null;
    const expiresAt = value.expiresAt ? new Date(value.expiresAt) : null;
    if (value.action === 'schedule' && (!scheduledAt || Number.isNaN(scheduledAt.getTime()))) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'La fecha programada es obligatoria.',
      });
    }
    if (value.scheduledAt && (!scheduledAt || Number.isNaN(scheduledAt.getTime()))) {
      context.addIssue({
        code: 'custom',
        path: ['scheduledAt'],
        message: 'Usa una fecha y hora válidas.',
      });
    }
    if (value.expiresAt && (!expiresAt || Number.isNaN(expiresAt.getTime()))) {
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: 'Usa una fecha y hora válidas.',
      });
    }
    if (scheduledAt && expiresAt && expiresAt <= scheduledAt) {
      context.addIssue({
        code: 'custom',
        path: ['expiresAt'],
        message: 'Debe ser posterior a la fecha programada.',
      });
    }
  });
