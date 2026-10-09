<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    id,
    label,
    class: className = '',
    required = false,
    helpText = '',
    error = '',
    maxLength,
    valueLength,
    children,
  }: {
    id: string;
    label: string;
    class?: string;
    required?: boolean;
    helpText?: string;
    error?: string;
    maxLength?: number;
    valueLength?: number;
    children?: Snippet;
  } = $props();

  let currentLength = $state(0);

  $effect(() => {
    if (valueLength !== undefined) {
      currentLength = valueLength;
      return;
    }
    if (!maxLength || typeof document === 'undefined') return;
    const control = document.getElementById(id);
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) return;

    const updateLength = () => {
      currentLength = control.value.length;
    };
    updateLength();
    control.addEventListener('input', updateLength);
    return () => control.removeEventListener('input', updateLength);
  });
</script>

<div
  class={className ? `form-field ${className}` : 'form-field'}
  class:form-field--error={Boolean(error)}
>
  <label class="form-field__label" for={id}>
    {label}{#if required}<span class="form-field__required" aria-hidden="true">*</span>{/if}
  </label>
  {@render children?.()}
  {#if helpText || maxLength}
    <div class="form-field__meta">
      {#if helpText}<span class="form-field__help">{helpText}</span>{/if}
      {#if maxLength}<span class="form-field__counter" aria-live="polite"
          >{valueLength ?? currentLength}/{maxLength}</span
        >{/if}
    </div>
  {/if}
  {#if error}<span id={`${id}-error`} class="form-field__error" role="alert">{error}</span>{/if}
</div>
