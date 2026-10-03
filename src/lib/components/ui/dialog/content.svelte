<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';

  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<DialogPrimitive.Portal>
  <DialogPrimitive.Overlay class="fixed inset-0 z-50 bg-black/50" />
  <DialogPrimitive.Content
    class={cn(
      'fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border bg-background p-6 shadow-lg',
      className,
    )}
    {...rest}
  >
    {@render children?.()}
  </DialogPrimitive.Content>
</DialogPrimitive.Portal>
