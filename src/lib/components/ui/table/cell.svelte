<script lang="ts">
  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<td class={cn('p-4 align-middle', className)} {...rest}>{@render children?.()}</td>
