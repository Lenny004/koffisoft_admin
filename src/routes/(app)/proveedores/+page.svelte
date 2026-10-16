<script lang="ts">
  import SupplierDirectory from '$lib/components/admin/supplier-directory.svelte';
  import type { InventoryActionForm, SupplierPageData } from '$lib/inventory/page-types';

  let { data, form }: { data: SupplierPageData; form: InventoryActionForm | null } = $props();
</script>

<SupplierDirectory {data} {form} />
