<script lang="ts">
  /**
   * Primitivo shadcn-svelte del panel; apariencia vía tokens CSS del tema, sin lógica de negocio.
   */
  import { Dialog as DialogPrimitive } from 'bits-ui';

  let { children, ...rest } = $props();
</script>

<DialogPrimitive.Close {...rest}>
  {@render children?.()}
</DialogPrimitive.Close>
