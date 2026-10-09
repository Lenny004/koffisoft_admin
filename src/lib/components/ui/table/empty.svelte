<script lang="ts">
  import { cn } from '$lib/utils.js';
  let { class: className = '', children, ...rest } = $props();
</script>

<div
  class={cn(
    'flex min-h-24 items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground',
    className,
  )}
  role="status"
  {...rest}
>
  {@render children?.()}
</div>
