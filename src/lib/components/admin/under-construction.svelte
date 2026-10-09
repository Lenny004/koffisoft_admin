<script lang="ts">
  import { Construction } from '@lucide/svelte';

  interface Props {
    title: string;
    description: string;
    permission: string;
  }

  let { title, description, permission }: Props = $props();
</script>

<section class="placeholder-page" aria-labelledby="placeholder-title">
  <div>
    <Construction class="placeholder-page__icon" aria-hidden="true" />
    <h2 class="placeholder-page__title" id="placeholder-title">{title}</h2>
    <p class="placeholder-page__description">{description}</p>
    <span class="placeholder-page__tag">En construcción · {permission}</span>
  </div>
</section>
