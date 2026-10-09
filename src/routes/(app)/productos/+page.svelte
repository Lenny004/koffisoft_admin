<script lang="ts">
  import type { PageProps } from './$types';
  import ProductCrud from '$lib/components/admin/product-crud.svelte';

  let { data }: PageProps = $props();
</script>

<svelte:head><title>Productos | Koffi-Soft Admin</title></svelte:head>

<section class="products" aria-labelledby="products-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Catálogo</p>
      <h2 class="page-header__title" id="products-title">Productos del menú</h2>
      <p class="page-header__description">
        Administra los productos visibles en la carta. La imagen se muestra desde un fixture
        mientras el contrato de medios evoluciona.
      </p>
    </div>
  </header>
  <ProductCrud data={data.products} source={data.source} />
</section>
