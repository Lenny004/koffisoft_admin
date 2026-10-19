<script lang="ts">
  /**
   * Primitivo shadcn-svelte del panel; apariencia vía tokens CSS del tema, sin lógica de negocio.
   */
  import { Dialog as DialogPrimitive } from 'bits-ui';

  let { open = $bindable(false), children, ...rest } = $props();
</script>

<DialogPrimitive.Root bind:open {...rest}>
  {@render children?.()}
</DialogPrimitive.Root>
