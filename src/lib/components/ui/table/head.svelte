<script lang="ts">
  /**
   * Primitivo shadcn-svelte del panel; apariencia vía tokens CSS del tema, sin lógica de negocio.
   */
  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<th
  class={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground', className)}
  {...rest}
>
  {@render children?.()}
</th>
