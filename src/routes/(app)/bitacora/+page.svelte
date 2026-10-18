<script lang="ts">
  import AuditLogBrowser from '$lib/components/admin/audit-log-browser.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<AuditLogBrowser {data} />
