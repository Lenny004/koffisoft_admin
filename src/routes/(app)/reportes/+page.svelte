<script lang="ts">
  /**
   * Marcador de reportes avanzados; muestra estado “en construcción” hasta haber módulo dedicado.
   */
  import UnderConstruction from '$lib/components/admin/under-construction.svelte';
</script>

<svelte:head><title>Reportes | Koffi-Soft Admin</title></svelte:head>
<UnderConstruction
  title="Reportes"
  permission="reports.read"
  description="La API ya reserva reports.read para este módulo; los reportes visuales del legacy se incorporarán cuando exista su endpoint de lectura."
/>
