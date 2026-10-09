<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import { X } from '@lucide/svelte';

  import { cn } from '$lib/utils.js';

  let { class: className = '', size = 'md', children, ...rest } = $props();

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
  } as const;
</script>

<DialogPrimitive.Portal>
  <DialogPrimitive.Overlay
    class="fixed inset-0 z-[var(--z-modal)] bg-foreground/50 backdrop-blur-[0.125rem]"
  />
  <DialogPrimitive.Content
    class={cn(
      'fixed left-1/2 top-1/2 z-[var(--z-modal)] grid max-h-[min(90dvh,48rem)] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 grid-rows-[auto_minmax(0,1fr)_auto] gap-4 overflow-hidden rounded-lg border bg-background p-6 text-foreground shadow-lg',
      sizes[size as keyof typeof sizes] ?? sizes.md,
      className,
    )}
    {...rest}
  >
    <DialogPrimitive.Close
      class="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Cerrar diálogo"
    >
      <X class="size-4" aria-hidden="true" />
    </DialogPrimitive.Close>
    <div class="min-h-0 overflow-y-auto">{@render children?.()}</div>
  </DialogPrimitive.Content>
</DialogPrimitive.Portal>
