<script lang="ts">
  import type { PageProps } from './$types';
  import UserDirectory from '$lib/components/admin/user-directory.svelte';

  let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Usuarios | Koffi-Soft Admin</title></svelte:head>
<UserDirectory {data} {form} />
