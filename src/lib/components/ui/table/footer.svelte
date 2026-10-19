<script lang="ts">
  /**
   * Primitivo shadcn-svelte del panel; apariencia vía tokens CSS del tema, sin lógica de negocio.
   */
  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<tfoot class={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)} {...rest}>
  {@render children?.()}
</tfoot>
