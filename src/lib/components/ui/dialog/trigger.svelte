<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';

  let { children, ...rest } = $props();
</script>

<DialogPrimitive.Trigger {...rest}>
  {@render children?.()}
</DialogPrimitive.Trigger>
