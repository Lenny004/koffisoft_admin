<script lang="ts">
  import ContactInbox from '$lib/components/admin/contact-inbox.svelte';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Bandeja de contacto | Koffi-Soft Admin</title></svelte:head>
<ContactInbox {data} {form} />
