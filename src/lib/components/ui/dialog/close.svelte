<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';

  let { children, ...rest } = $props();
</script>

<DialogPrimitive.Close {...rest}>
  {@render children?.()}
</DialogPrimitive.Close>
