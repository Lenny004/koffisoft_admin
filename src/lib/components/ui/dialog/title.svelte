<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';

  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<DialogPrimitive.Title class={cn('text-lg font-semibold', className)} {...rest}>
  {@render children?.()}
</DialogPrimitive.Title>
