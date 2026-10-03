<script lang="ts">
  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<tfoot class={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)} {...rest}>
  {@render children?.()}
</tfoot>
