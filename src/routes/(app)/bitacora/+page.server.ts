import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

import { createAuditLogsClient, AuditLogsApiError } from '$lib/server/audit-logs';
import { createUsersClient } from '$lib/server/users';
import { auditLogFilterSchema } from '$lib/validation/audit-logs';

const emptyMeta = { page: 1, pageSize: 20, total: 0, totalPages: 1 };

export const load = async (event: RequestEvent) => {
  const parsed = auditLogFilterSchema.safeParse({
    page: event.url.searchParams.get('page') ?? '1',
    actorUserId: event.url.searchParams.get('actorUserId') ?? '',
    action: event.url.searchParams.get('action') ?? '',
    entityType: event.url.searchParams.get('entityType') ?? '',
    dateFrom: event.url.searchParams.get('dateFrom') ?? '',
    dateTo: event.url.searchParams.get('dateTo') ?? '',
  });
  const filters = parsed.success ? parsed.data : auditLogFilterSchema.parse({});
  const permissions = event.locals.permissions;
  const empty = { logs: [], users: [], meta: { ...emptyMeta, page: filters.page }, filters };

  if (!env.API_BASE_URL || !permissions.includes('audit_logs.read')) {
    return {
      ...empty,
      error: permissions.includes('audit_logs.read')
        ? 'Configura API_BASE_URL para consultar la bitácora.'
        : undefined,
    };
  }

  try {
    const [logs, users] = await Promise.all([
      createAuditLogsClient(event, env.API_BASE_URL).list({
        page: filters.page,
        pageSize: 20,
        actorUserId: filters.actorUserId || undefined,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
      }),
      createUsersClient(event, env.API_BASE_URL)
        .listUsers({ page: 1, pageSize: 100 })
        .catch(() => ({ data: [] })),
    ]);
    return {
      logs: logs.data,
      users: users.data,
      meta: logs.meta,
      filters,
      error: undefined,
    };
  } catch (error) {
    return {
      ...empty,
      error: error instanceof AuditLogsApiError ? error.message : 'No se pudo cargar la bitácora.',
    };
  }
};
