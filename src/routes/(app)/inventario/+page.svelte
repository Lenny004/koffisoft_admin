<script lang="ts">
  import InventoryModule from '$lib/components/admin/inventory-module.svelte';
  import type { InventoryActionForm, InventoryPageData } from '$lib/inventory/page-types';

  let { data, form }: { data: InventoryPageData; form: InventoryActionForm | null } = $props();
</script>

<InventoryModule {data} {form} />
