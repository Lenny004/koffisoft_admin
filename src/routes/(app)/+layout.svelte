<script lang="ts">
  import AdminShell from '$lib/components/admin/admin-shell.svelte';
  import type { LayoutProps } from './$types';

  let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
  <meta name="description" content="Panel privado de administración de Koffi-Soft." />
</svelte:head>

<AdminShell user={data.user!} permissions={data.permissions ?? []}>
  {@render children()}
</AdminShell>
