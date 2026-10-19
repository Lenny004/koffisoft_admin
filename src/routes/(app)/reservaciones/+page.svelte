<script lang="ts">
  /**
   * Ruta de reservaciones: mesas, espacios y transiciones de estado en `reservation-module`.
   */
  import ReservationModule from '$lib/components/admin/reservation-module.svelte';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Reservaciones | Koffi-Soft Admin</title></svelte:head>
<ReservationModule {data} {form} />
