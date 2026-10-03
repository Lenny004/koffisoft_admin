<script lang="ts">
  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<th
  class={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground', className)}
  {...rest}
>
  {@render children?.()}
</th>
