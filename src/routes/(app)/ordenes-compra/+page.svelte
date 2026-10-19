<script lang="ts">
  /**
   * Ruta de órdenes de compra: monta flujo de borrador, aprobación y recepción.
   */
  import PurchaseOrderModule from '$lib/components/admin/purchase-order-module.svelte';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>

<PurchaseOrderModule {data} {form} />
