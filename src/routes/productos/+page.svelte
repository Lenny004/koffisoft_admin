<script lang="ts">
  import ProductCrud from '$lib/components/admin/product-crud.svelte';
</script>

<svelte:head>
  <title>Productos | Koffi-Soft Admin</title>
</svelte:head>

<main class="mx-auto max-w-6xl px-6 py-12">
  <div class="mb-8 space-y-2">
    <p class="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Fase 0</p>
    <h1 class="text-4xl font-semibold tracking-tight">Tabla CRUD de ejemplo</h1>
    <p class="max-w-2xl text-muted-foreground">
      La tabla usa TanStack Svelte Table v9 y el formulario valida con Zod. Los datos son locales y
      temporales: no se conectan todavía a la API ni a la base de datos.
    </p>
  </div>
  <ProductCrud />
</main>
