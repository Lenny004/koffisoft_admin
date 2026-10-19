<script lang="ts">
  /**
   * Primitivo shadcn-svelte del panel; apariencia vía tokens CSS del tema, sin lógica de negocio.
   */
  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<div class={cn('rounded-xl border bg-card text-card-foreground shadow-sm', className)} {...rest}>
  {@render children?.()}
</div>
