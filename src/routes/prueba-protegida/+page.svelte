<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';

  let { data } = $props();
</script>

<svelte:head>
  <title>Ruta protegida de prueba | Koffi-Soft Admin</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-6 px-6 py-16">
  <p class="text-sm font-semibold uppercase tracking-[0.25em] text-primary">Prueba local</p>
  <h1 class="text-4xl font-semibold tracking-tight">Ruta protegida habilitada</h1>
  <p class="text-muted-foreground">
    Estado: {data.status}. Esta pantalla no implementa autenticación real.
  </p>
  <Button href="/">Volver al inicio</Button>
</main>
