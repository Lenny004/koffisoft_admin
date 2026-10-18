<script lang="ts">
  import { resolve } from '$app/paths';

  import { Alert } from '$lib/components/ui/alert/index.js';
  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import { formatElSalvadorDateTime } from '$lib/formatting/dates';
  import {
    NOTIFICATION_SEVERITIES,
    NOTIFICATION_SEVERITY_LABELS,
    NOTIFICATION_TYPE_LABELS,
    NOTIFICATION_TYPES,
    type NotificationItem,
    type NotificationPageMeta,
    type NotificationSeverity,
  } from '$lib/notifications/types';
  import { globalErrors as getGlobalErrors } from '$lib/validation/errors';

  interface ActionForm {
    action?: string;
    success?: boolean;
    errors?: Record<string, string> | string[];
  }

  interface Props {
    data: {
      notifications: NotificationItem[];
      meta: NotificationPageMeta;
      filters: {
        page: number;
        notificationType: string;
        severity: string;
        unreadOnly: boolean;
        includeArchived: boolean;
      };
      error?: string;
    };
    form?: ActionForm | null;
  }

  let { data, form }: Props = $props();

  const severityVariant: Record<NotificationSeverity, 'info' | 'warning' | 'danger' | 'success'> = {
    Info: 'info',
    Warning: 'warning',
    Error: 'danger',
    Success: 'success',
  };

  function destination(link: string | null): string | null {
    return link?.startsWith('/') ? link : null;
  }

  function pageQuery(page: number): string {
    const params = new URLSearchParams();
    if (data.filters.notificationType)
      params.set('notificationType', data.filters.notificationType);
    if (data.filters.severity) params.set('severity', data.filters.severity);
    if (data.filters.unreadOnly) params.set('unreadOnly', '1');
    if (data.filters.includeArchived) params.set('includeArchived', '1');
    if (page > 1) params.set('page', String(page));
    const query = params.toString();
    return query ? `?${query}` : '';
  }
</script>

<svelte:head><title>Notificaciones | Koffi-Soft Admin</title></svelte:head>

<section class="notifications" aria-labelledby="notifications-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Alertas operativas</p>
      <h2 class="page-header__title" id="notifications-title">Notificaciones</h2>
      <p class="page-header__description">
        Revisa alertas de inventario, reservas, contactos y sistema. Marca como leídas o archiva las
        que ya no necesitas.
      </p>
    </div>
    <form method="POST" action="?/markAll">
      <Button type="submit" variant="secondary">Marcar todas como leídas</Button>
    </form>
  </header>

  {#if data.error}<Alert variant="destructive"><p>{data.error}</p></Alert>{/if}
  {#if getGlobalErrors(form?.errors).length}
    <Alert variant="destructive">
      {#each getGlobalErrors(form?.errors) as message (message)}<p>{message}</p>{/each}
    </Alert>
  {/if}

  <Card.Card>
    <Card.CardHeader>
      <Card.CardTitle>Bandeja</Card.CardTitle>
      <Card.CardDescription>
        Filtra por estado de lectura, tipo y severidad. La campana del topbar se actualiza en vivo.
      </Card.CardDescription>
    </Card.CardHeader>
    <Card.CardContent>
      <form class="notifications__toolbar" method="GET">
        <FormField id="notification-type" label="Tipo">
          <select
            id="notification-type"
            name="notificationType"
            value={data.filters.notificationType}
          >
            <option value="">Todos los tipos</option>
            {#each NOTIFICATION_TYPES as type (type)}
              <option value={type}>{NOTIFICATION_TYPE_LABELS[type]}</option>
            {/each}
          </select>
        </FormField>
        <FormField id="notification-severity" label="Severidad">
          <select id="notification-severity" name="severity" value={data.filters.severity}>
            <option value="">Todas</option>
            {#each NOTIFICATION_SEVERITIES as severity (severity)}
              <option value={severity}>{NOTIFICATION_SEVERITY_LABELS[severity]}</option>
            {/each}
          </select>
        </FormField>
        <label class="suppliers__checkbox">
          <input type="checkbox" name="unreadOnly" value="1" checked={data.filters.unreadOnly} />
          Solo no leídas
        </label>
        <label class="suppliers__checkbox">
          <input
            type="checkbox"
            name="includeArchived"
            value="1"
            checked={data.filters.includeArchived}
          />
          Incluir archivadas
        </label>
        <Button type="submit" variant="secondary">Filtrar</Button>
      </form>

      {#if data.notifications.length}
        <div class="notifications__list">
          {#each data.notifications as item (item.id)}
            <article class="notifications__item" class:is-unread={!item.readAt}>
              <div class="notifications__heading">
                <div>
                  <h3 class="notifications__title">{item.title}</h3>
                  <div class="notifications__meta">
                    <Badge variant={severityVariant[item.severity]}>
                      {NOTIFICATION_SEVERITY_LABELS[item.severity]}
                    </Badge>
                    <span>{NOTIFICATION_TYPE_LABELS[item.notificationType]}</span>
                    <span>{formatElSalvadorDateTime(item.createdAt)}</span>
                    {#if item.archived}<span>Archivada</span>{/if}
                  </div>
                </div>
                <div class="notifications__actions">
                  {#if !item.readAt}
                    <form method="POST" action="?/markRead">
                      <input type="hidden" name="notificationId" value={item.id} />
                      <Button type="submit" variant="outline" size="sm">Marcar leída</Button>
                    </form>
                  {/if}
                  {#if !item.archived}
                    <form method="POST" action="?/archive">
                      <input type="hidden" name="notificationId" value={item.id} />
                      <Button type="submit" variant="ghost" size="sm">Archivar</Button>
                    </form>
                  {/if}
                </div>
              </div>
              <p class="notifications__body">{item.body}</p>
              {#if destination(item.internalLink)}
                <a
                  class="inventory__link"
                  href={resolve(
                    (destination(item.internalLink) ?? '/notificaciones') as '/notificaciones',
                  )}
                >
                  Ir al destino
                </a>
              {/if}
            </article>
          {/each}
        </div>
      {:else}
        <p class="notifications__empty">No hay notificaciones para los filtros actuales.</p>
      {/if}

      <nav class="suppliers__pagination" aria-label="Paginación de notificaciones">
        <span>{data.meta.total} resultado{data.meta.total === 1 ? '' : 's'}</span>
        <div class="suppliers__pagination-actions">
          {#if data.meta.page > 1}
            <a
              class="suppliers__page-link"
              href={resolve(`/notificaciones${pageQuery(data.meta.page - 1)}` as '/notificaciones')}
              >Anterior</a
            >
          {/if}
          <span>Página {data.meta.page} de {data.meta.totalPages || 1}</span>
          {#if data.meta.page < data.meta.totalPages}
            <a
              class="suppliers__page-link"
              href={resolve(`/notificaciones${pageQuery(data.meta.page + 1)}` as '/notificaciones')}
              >Siguiente</a
            >
          {/if}
        </div>
      </nav>
    </Card.CardContent>
  </Card.Card>
</section>
