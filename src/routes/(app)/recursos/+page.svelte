<script lang="ts">
  /**
   * Ruta de recursos operativos (mantenimiento): calendario y estados del módulo admin.
   */
  import ResourceDirectory from '$lib/components/admin/resource-directory.svelte';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>

<ResourceDirectory {data} {form} />
