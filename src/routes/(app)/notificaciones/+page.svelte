<script lang="ts">
  import NotificationInbox from '$lib/components/admin/notification-inbox.svelte';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
</script>

<NotificationInbox {data} {form} />
