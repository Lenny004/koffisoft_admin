<script lang="ts">
  import { Eye, EyeOff } from '@lucide/svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';

  let {
    id,
    name,
    value = $bindable(''),
    placeholder = '',
    autocomplete = 'current-password',
    minlength,
    maxlength,
    required = false,
    invalid = false,
    describedBy,
  }: {
    id: string;
    name: string;
    value?: string;
    placeholder?: string;
    autocomplete?: HTMLInputAttributes['autocomplete'];
    minlength?: number;
    maxlength?: number;
    required?: boolean;
    invalid?: boolean;
    describedBy?: string;
  } = $props();

  let visible = $state(false);
</script>

<div class="login-card__password">
  <input
    class="login-card__input login-card__input--reveal"
    {id}
    {name}
    type={visible ? 'text' : 'password'}
    bind:value
    {placeholder}
    {autocomplete}
    {minlength}
    {maxlength}
    {required}
    aria-invalid={invalid}
    aria-describedby={describedBy}
  />
  <button
    class="login-card__reveal"
    type="button"
    aria-controls={id}
    aria-pressed={visible}
    aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
    onclick={() => (visible = !visible)}
  >
    {#if visible}
      <EyeOff class="login-card__reveal-icon" aria-hidden="true" />
    {:else}
      <Eye class="login-card__reveal-icon" aria-hidden="true" />
    {/if}
  </button>
</div>
