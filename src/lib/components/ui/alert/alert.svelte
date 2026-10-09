<script lang="ts">
  import { cn } from '$lib/utils.js';

  type AlertVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';
  let { class: className = '', variant = 'default' as AlertVariant, children, ...rest } = $props();

  const classes = $derived(
    cn(
      'relative w-full rounded-lg border px-4 py-3 text-sm',
      {
        'border-border bg-card text-card-foreground': variant === 'default',
        'border-destructive/50 bg-destructive/10 text-destructive dark:border-destructive':
          variant === 'destructive',
        'border-status-success/50 bg-status-success/10 text-status-success': variant === 'success',
        'border-status-warning/50 bg-status-warning/10 text-foreground': variant === 'warning',
        'border-primary/50 bg-primary/10 text-foreground': variant === 'info',
      },
      className,
    ),
  );
</script>

<div class={classes} role="alert" {...rest}>
  {@render children?.()}
</div>
