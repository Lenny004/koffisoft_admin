<script lang="ts">
  import type { PageProps } from './$types';
  import ProductCrud from '$lib/components/admin/product-crud.svelte';

  let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Productos | Koffi-Soft Admin</title></svelte:head>

<section class="products" aria-labelledby="products-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Catálogo</p>
      <h2 class="page-header__title" id="products-title">Productos del menú</h2>
      <p class="page-header__description">
        Administra los ítems visibles en la carta. La API no expone imágenes; la foto mostrada es
        una presentación provisional tomada de los assets locales.
      </p>
    </div>
  </header>
  <ProductCrud {data} {form} />
</section>
