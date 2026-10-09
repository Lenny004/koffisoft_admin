<script lang="ts">
  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<div class={cn('min-h-0 overflow-y-auto', className)} {...rest}>{@render children?.()}</div>
