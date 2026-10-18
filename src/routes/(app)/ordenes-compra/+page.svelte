<script lang="ts">
  import PurchaseOrderModule from '$lib/components/admin/purchase-order-module.svelte';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>

<PurchaseOrderModule {data} {form} />
