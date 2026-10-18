import { z } from 'zod';

import { NOTIFICATION_SEVERITIES, NOTIFICATION_TYPES } from '$lib/notifications/types';
import { FORM_LIMITS } from './limits';

export const notificationFilterSchema = z.object({
  page: z.coerce.number().int().min(FORM_LIMITS.pagination.pageMin).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(FORM_LIMITS.pagination.pageSizeMax)
    .default(20),
  notificationType: z.enum(NOTIFICATION_TYPES).or(z.literal('')).default(''),
  severity: z.enum(NOTIFICATION_SEVERITIES).or(z.literal('')).default(''),
  unreadOnly: z.boolean().default(false),
  includeArchived: z.boolean().default(false),
});

export const markNotificationSchema = z.object({
  notificationId: z.string().uuid('La notificación no es válida.').optional().or(z.literal('')),
});

export const archiveNotificationSchema = z.object({
  notificationId: z.string().uuid('La notificación no es válida.'),
});
