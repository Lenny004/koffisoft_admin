<script lang="ts">
  import { Button as ButtonPrimitive } from 'bits-ui';

  import { cn } from '$lib/utils.js';

  type ButtonVariant =
    'primary' | 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
  type ButtonSize = 'sm' | 'md' | 'lg' | 'default' | 'icon';

  let {
    class: className = '',
    variant = 'primary' as ButtonVariant,
    size = 'md' as ButtonSize,
    loading = false,
    disabled = false,
    children,
    ...rest
  } = $props();

  const classes = $derived(
    cn(
      'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
      {
        'bg-primary text-primary-foreground hover:bg-primary/90':
          variant === 'primary' || variant === 'default',
        'bg-destructive text-destructive-foreground hover:bg-destructive/90':
          variant === 'destructive',
        'border border-input bg-background hover:bg-accent hover:text-accent-foreground':
          variant === 'outline',
        'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
        'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
        'text-primary underline-offset-4 hover:underline': variant === 'link',
        'h-10 px-4 py-2': size === 'md' || size === 'default',
        'h-9 rounded-md px-3': size === 'sm',
        'h-11 rounded-md px-8': size === 'lg',
        'size-10': size === 'icon',
      },
      className,
    ),
  );
</script>

<ButtonPrimitive.Root
  class={classes}
  disabled={disabled || loading}
  aria-busy={loading || undefined}
  {...rest}
>
  {#if loading}<span class="animate-spin" aria-hidden="true">◌</span>{/if}
  {@render children?.()}
</ButtonPrimitive.Root>
