<script lang="ts">
  import EventModule from '$lib/components/admin/event-module.svelte';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Eventos | Koffi-Soft Admin</title></svelte:head>
<EventModule {data} {form} />
