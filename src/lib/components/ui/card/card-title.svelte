<script lang="ts">
  /**
   * Primitivo shadcn-svelte del panel; apariencia vía tokens CSS del tema, sin lógica de negocio.
   */
  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<h3 class={cn('font-semibold leading-none tracking-tight', className)} {...rest}>
  {@render children?.()}
</h3>
