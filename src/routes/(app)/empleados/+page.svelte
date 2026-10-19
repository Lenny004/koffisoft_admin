<script lang="ts">
  /**
   * Ruta de empleados: conecta `employee-directory` con altas y bajas vía actions.
   */
  import type { PageProps } from './$types';
  import EmployeeDirectory from '$lib/components/admin/employee-directory.svelte';

  let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Empleados | Koffi-Soft Admin</title></svelte:head>
<EmployeeDirectory {data} {form} />
