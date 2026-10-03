<script lang="ts">
  import { ArrowRight, ShieldCheck } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button/index.js';
</script>

<svelte:head>
  <title>Koffi-Soft | Administración</title>
  <meta name="description" content="Base inicial del panel privado de Koffi-Soft." />
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-16">
  <section class="space-y-8 rounded-3xl bg-card p-8 shadow-sm ring-1 ring-border md:p-12">
    <div class="flex items-center gap-3 text-primary">
      <ShieldCheck class="size-6" aria-hidden="true" />
      <p class="text-sm font-semibold uppercase tracking-[0.25em]">Koffi-Soft Admin</p>
    </div>
    <div class="space-y-4">
      <h1 class="text-4xl font-semibold tracking-tight md:text-5xl">
        Panel privado en preparación.
      </h1>
      <p class="max-w-2xl text-lg text-muted-foreground">
        El esqueleto de Fase 0 ya tiene Svelte 5, shadcn-svelte, Data Table y validación Zod. La
        autenticación real se implementará contra las sesiones HttpOnly de la API en una fase
        posterior.
      </p>
    </div>
    <div class="flex flex-wrap gap-3">
      <Button href="/productos">
        Ver tabla CRUD de ejemplo
        <ArrowRight class="ml-2 size-4" />
      </Button>
      <Button href="/prueba-protegida" variant="outline">Ruta protegida de prueba</Button>
    </div>
  </section>
</main>
