<article class="feature-card">
  <h2 class="feature-card__title">Feature</h2>
</article>

<style>
  /* The Svelte component is the block owner. */
  .feature-card {
    display: grid;
    gap: var(--space-md);
    padding: var(--space-lg);
    background: var(--color-surface);
    border: var(--border);
    border-radius: var(--radius-md);
  }

  .feature-card__title {
    margin: 0;
  }
</style>
