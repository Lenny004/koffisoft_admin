<script lang="ts">
  /**
   * Primitivo shadcn-svelte del panel; apariencia vía tokens CSS del tema, sin lógica de negocio.
   */
  import { Dialog as DialogPrimitive } from 'bits-ui';

  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<DialogPrimitive.Title class={cn('text-lg font-semibold', className)} {...rest}>
  {@render children?.()}
</DialogPrimitive.Title>
