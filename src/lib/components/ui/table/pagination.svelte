<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils.js';
  import { Button } from '../button/index.js';

  type PaginationProps = {
    currentPage?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    class?: string;
    children?: Snippet;
  };

  let {
    currentPage = 1,
    totalPages = 1,
    onPageChange = () => {},
    class: className = '',
    children,
    ...rest
  }: PaginationProps = $props();
</script>

<nav
  class={cn('flex flex-wrap items-center justify-between gap-3', className)}
  aria-label="Paginación"
  {...rest}
>
  {@render children?.()}
  {#if totalPages > 1}
    <div class="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onclick={() => onPageChange(currentPage - 1)}
      >
        Anterior
      </Button>
      <span class="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onclick={() => onPageChange(currentPage + 1)}
      >
        Siguiente
      </Button>
    </div>
  {/if}
</nav>
