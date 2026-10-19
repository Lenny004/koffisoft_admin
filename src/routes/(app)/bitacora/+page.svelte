<script lang="ts">
  /**
   * Ruta de bitácora: delega listado y filtros en `audit-log-browser` con datos del servidor.
   */
  import AuditLogBrowser from '$lib/components/admin/audit-log-browser.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<AuditLogBrowser {data} />
