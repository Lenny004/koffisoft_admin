<script lang="ts">
  /**
   * Campana del topbar: lista reciente, contador de no leídas y actualización en vivo
   * vía SSE cuando el módulo está habilitado para la sesión.
   */
  import { Bell } from '@lucide/svelte';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';

  import { Badge } from '$lib/components/ui/badge/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import { formatElSalvadorDateTime } from '$lib/formatting/dates';
  import {
    NOTIFICATION_SEVERITY_LABELS,
    NOTIFICATION_TYPE_LABELS,
    type NotificationItem,
    type NotificationSeverity,
  } from '$lib/notifications/types';

  interface Props {
    initialItems: NotificationItem[];
    initialUnread: number;
    enabled: boolean;
  }

  let { initialItems, initialUnread, enabled }: Props = $props();
  let open = $state(false);
  let items = $state<NotificationItem[]>([]);
  let unreadCount = $state(0);

  $effect(() => {
    items = initialItems;
    unreadCount = initialUnread;
  });

  const severityVariant: Record<NotificationSeverity, 'info' | 'warning' | 'danger' | 'success'> = {
    Info: 'info',
    Warning: 'warning',
    Error: 'danger',
    Success: 'success',
  };

  /** Solo enlaces internos del panel pueden navegar con `resolve`; el resto se muestra sin href. */
  function destination(link: string | null): string | null {
    return link?.startsWith('/') ? link : null;
  }

  /** Marca lectura o archiva vía API JSON y sincroniza el estado local del panel desplegable. */
  async function postAction(action: 'mark-read' | 'archive', notificationId?: string) {
    const response = await fetch('/api/notificaciones', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ action, notificationId }),
    });
    if (!response.ok) return;
    if (action === 'archive' && notificationId) {
      items = items.filter((item) => item.id !== notificationId);
      return;
    }
    const readAt = new Date().toISOString();
    if (notificationId) {
      items = items.map((item) => (item.id === notificationId ? { ...item, readAt } : item));
      unreadCount = Math.max(0, unreadCount - 1);
      return;
    }
    items = items.map((item) => ({ ...item, readAt: item.readAt ?? readAt }));
    unreadCount = 0;
  }

  onMount(() => {
    if (!enabled) return;
    let retryMs = 1000;
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    /** Abre el stream SSE con reintento exponencial ante cortes de red. */
    function connect() {
      source?.close();
      source = new EventSource('/api/notificaciones/stream');
      source.onmessage = (event) => {
        retryMs = 1000;
        try {
          const incoming = JSON.parse(event.data) as NotificationItem;
          items = [incoming, ...items.filter((item) => item.id !== incoming.id)].slice(0, 8);
          if (!incoming.readAt) unreadCount += 1;
        } catch {
          // El servidor puede enviar un comentario de keep-alive.
        }
      };
      source.onerror = () => {
        source?.close();
        timer = setTimeout(connect, retryMs);
        retryMs = Math.min(retryMs * 2, 15_000);
      };
    }

    connect();
    return () => {
      source?.close();
      if (timer) clearTimeout(timer);
    };
  });
</script>

{#if enabled}
  <div class="notification-bell">
    <button
      class="admin-topbar__icon-button notification-bell__trigger"
      type="button"
      aria-label={unreadCount ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
      aria-expanded={open}
      aria-haspopup="true"
      onclick={() => (open = !open)}
    >
      <Bell aria-hidden="true" />
      {#if unreadCount > 0}
        <span class="notification-bell__badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
      {/if}
    </button>
    {#if open}
      <div class="notification-bell__panel" role="dialog" aria-label="Notificaciones recientes">
        <div class="notification-bell__header">
          <h2 class="notification-bell__title">Notificaciones</h2>
          {#if unreadCount > 0}
            <Button variant="link" size="sm" onclick={() => postAction('mark-read')}>
              Marcar todas
            </Button>
          {/if}
        </div>
        {#if items.length}
          <ul class="notification-bell__list">
            {#each items as item (item.id)}
              <li>
                {#if destination(item.internalLink)}
                  <a
                    class="notification-bell__item"
                    class:is-unread={!item.readAt}
                    href={resolve(
                      (destination(item.internalLink) ?? '/notificaciones') as '/notificaciones',
                    )}
                    onclick={() => {
                      if (!item.readAt) void postAction('mark-read', item.id);
                      open = false;
                    }}
                  >
                    <strong>{item.title}</strong>
                    <p class="notification-bell__body">{item.body}</p>
                    <div class="notification-bell__meta">
                      <Badge variant={severityVariant[item.severity]}>
                        {NOTIFICATION_SEVERITY_LABELS[item.severity]}
                      </Badge>
                      <span>{NOTIFICATION_TYPE_LABELS[item.notificationType]}</span>
                      <span>{formatElSalvadorDateTime(item.createdAt)}</span>
                    </div>
                  </a>
                {:else}
                  <button
                    class="notification-bell__item"
                    class:is-unread={!item.readAt}
                    type="button"
                    onclick={() => {
                      if (!item.readAt) void postAction('mark-read', item.id);
                    }}
                  >
                    <strong>{item.title}</strong>
                    <p class="notification-bell__body">{item.body}</p>
                    <div class="notification-bell__meta">
                      <Badge variant={severityVariant[item.severity]}>
                        {NOTIFICATION_SEVERITY_LABELS[item.severity]}
                      </Badge>
                      <span>{NOTIFICATION_TYPE_LABELS[item.notificationType]}</span>
                      <span>{formatElSalvadorDateTime(item.createdAt)}</span>
                    </div>
                  </button>
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          <p class="notification-bell__empty">No hay notificaciones recientes.</p>
        {/if}
        <div class="notification-bell__footer">
          <a
            class="admin-topbar__profile-link"
            href={resolve('/notificaciones')}
            onclick={() => (open = false)}
          >
            Ver todas
          </a>
        </div>
      </div>
    {/if}
  </div>
{/if}
