<script lang="ts">
  /**
   * Ruta de notificaciones: bandeja completa con las mismas acciones que la campana del shell.
   */
  import NotificationInbox from '$lib/components/admin/notification-inbox.svelte';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>

<NotificationInbox {data} {form} />
