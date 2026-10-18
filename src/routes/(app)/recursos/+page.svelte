<script lang="ts">
  import ResourceDirectory from '$lib/components/admin/resource-directory.svelte';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>

<ResourceDirectory {data} {form} />
