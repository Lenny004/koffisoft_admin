<script lang="ts">
  import { resolve } from '$app/paths';

  import { Alert } from '$lib/components/ui/alert/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import SearchSelect from '$lib/components/ui/search-select.svelte';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Table from '$lib/components/ui/table/index.js';
  import type { AuditLogItem } from '$lib/audit/types';
  import { formatElSalvadorDateTime } from '$lib/formatting/dates';
  import type { UserRow } from '$lib/users/types';
  import { FORM_LIMITS } from '$lib/validation/limits';

  interface Props {
    data: {
      logs: AuditLogItem[];
      users: UserRow[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
      filters: {
        page: number;
        actorUserId: string;
        action: string;
        entityType: string;
        dateFrom: string;
        dateTo: string;
      };
      error?: string;
    };
  }

  let { data }: Props = $props();
  const userOptions = $derived(
    data.users.map((user) => ({
      value: user.id,
      label: `${user.username} · ${user.email}`,
    })),
  );

  function pageQuery(page: number): string {
    const params = new URLSearchParams();
    if (data.filters.actorUserId) params.set('actorUserId', data.filters.actorUserId);
    if (data.filters.action) params.set('action', data.filters.action);
    if (data.filters.entityType) params.set('entityType', data.filters.entityType);
    if (data.filters.dateFrom) params.set('dateFrom', data.filters.dateFrom);
    if (data.filters.dateTo) params.set('dateTo', data.filters.dateTo);
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  function userLabel(userId: string | null): string {
    if (!userId) return 'Sistema';
    return data.users.find((user) => user.id === userId)?.username ?? userId;
  }
</script>

<svelte:head><title>Bitácora | Koffi-Soft Admin</title></svelte:head>

<section class="audit-logs" aria-labelledby="audit-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Auditoría</p>
      <h2 class="page-header__title" id="audit-title">Bitácora</h2>
      <p class="page-header__description">
        Consulta acciones administrativas por usuario, entidad y rango de fechas.
      </p>
    </div>
  </header>

  {#if data.error}<Alert variant="destructive"><p>{data.error}</p></Alert>{/if}

  <Card.Card>
    <Card.CardHeader>
      <Card.CardTitle>Registros</Card.CardTitle>
      <Card.CardDescription>Los filtros se aplican en el servidor.</Card.CardDescription>
    </Card.CardHeader>
    <Card.CardContent>
      <form class="suppliers__toolbar" method="GET">
        <FormField id="audit-user" label="Usuario">
          <SearchSelect
            id="audit-user"
            name="actorUserId"
            value={data.filters.actorUserId}
            options={userOptions}
            placeholder="Todos los usuarios"
            emptyLabel="Todos los usuarios"
          />
        </FormField>
        <FormField id="audit-action" label="Acción">
          <input
            id="audit-action"
            name="action"
            value={data.filters.action}
            maxlength={FORM_LIMITS.auditLog.searchMaxLength}
            placeholder="Ej. resource.created"
            autocomplete="off"
          />
        </FormField>
        <FormField id="audit-entity" label="Entidad">
          <input
            id="audit-entity"
            name="entityType"
            value={data.filters.entityType}
            maxlength={FORM_LIMITS.auditLog.searchMaxLength}
            placeholder="Ej. purchase_order"
            autocomplete="off"
          />
        </FormField>
        <FormField id="audit-from" label="Desde">
          <input id="audit-from" name="dateFrom" type="date" value={data.filters.dateFrom} />
        </FormField>
        <FormField id="audit-to" label="Hasta">
          <input id="audit-to" name="dateTo" type="date" value={data.filters.dateTo} />
        </FormField>
        <Button type="submit" variant="secondary">Filtrar</Button>
      </form>
      <div class="suppliers__table-wrap">
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="suppliers__table-head">Fecha</Table.Head>
              <Table.Head class="suppliers__table-head">Usuario</Table.Head>
              <Table.Head class="suppliers__table-head">Acción</Table.Head>
              <Table.Head class="suppliers__table-head">Entidad</Table.Head>
              <Table.Head class="suppliers__table-head">Identificador</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.logs as log (log.id)}
              <Table.Row>
                <Table.Cell>{formatElSalvadorDateTime(log.createdAt)}</Table.Cell>
                <Table.Cell>{userLabel(log.actorUserId)}</Table.Cell>
                <Table.Cell>{log.action}</Table.Cell>
                <Table.Cell>{log.entityType}</Table.Cell>
                <Table.Cell>{log.entityId ?? '—'}</Table.Cell>
              </Table.Row>
            {:else}
              <Table.Row>
                <Table.Cell colspan={5} class="suppliers__empty">No hay registros.</Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
      <nav class="suppliers__pagination" aria-label="Paginación de bitácora">
        <span>{data.meta.total} registro{data.meta.total === 1 ? '' : 's'}</span>
        <div class="suppliers__pagination-actions">
          {#if data.meta.page > 1}
            <a
              class="suppliers__page-link"
              href={resolve(`/bitacora${pageQuery(data.meta.page - 1)}` as '/bitacora')}>Anterior</a
            >
          {/if}
          <span>Página {data.meta.page} de {data.meta.totalPages || 1}</span>
          {#if data.meta.page < data.meta.totalPages}
            <a
              class="suppliers__page-link"
              href={resolve(`/bitacora${pageQuery(data.meta.page + 1)}` as '/bitacora')}
              >Siguiente</a
            >
          {/if}
        </div>
      </nav>
    </Card.CardContent>
  </Card.Card>
</section>
