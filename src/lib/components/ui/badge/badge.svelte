<script lang="ts">
  import { cn } from '$lib/utils.js';

  type BadgeVariant =
    'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
  let { class: className = '', variant = 'default' as BadgeVariant, children, ...rest } = $props();

  const classes = $derived(
    cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
      {
        'border-transparent bg-primary text-primary-foreground': variant === 'default',
        'border-transparent bg-secondary text-secondary-foreground': variant === 'secondary',
        'border-border bg-transparent text-foreground': variant === 'outline',
        'border-transparent bg-status-success text-white': variant === 'success',
        'border-transparent bg-status-warning text-foreground': variant === 'warning',
        'border-transparent bg-destructive text-destructive-foreground': variant === 'danger',
        'border-transparent bg-accent text-accent-foreground': variant === 'info',
      },
      className,
    ),
  );
</script>

<span class={classes} {...rest}>{@render children?.()}</span>
