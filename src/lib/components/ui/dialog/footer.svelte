<script lang="ts">
  import { cn } from '$lib/utils.js';

  let { class: className = '', children, ...rest } = $props();
</script>

<div class={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...rest}>
  {@render children?.()}
</div>
