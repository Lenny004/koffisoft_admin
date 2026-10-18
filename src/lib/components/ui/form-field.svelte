<script lang="ts">
  /**
   * Envoltorio de campo de formulario: etiqueta, ayuda, contador opcional y sincronización
   * de atributos ARIA en el control hijo según errores de validación.
   */
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

    /** Refleja en el contador la longitud actual del input o textarea asociado por `id`. */
    const updateLength = () => {
      currentLength = control.value.length;
    };
    updateLength();
    control.addEventListener('input', updateLength);
    return () => control.removeEventListener('input', updateLength);
  });

  $effect(() => {
    if (typeof document === 'undefined') return;
    const control = document.getElementById(id);
    if (!(
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
    ))
      return;

    const errorId = `${id}-error`;
    const describedBy = (control.getAttribute('aria-describedby') ?? '')
      .split(/\s+/u)
      .filter((value) => value && value !== errorId);
    if (error) {
      control.setAttribute('aria-describedby', [...describedBy, errorId].join(' '));
      control.setAttribute('aria-errormessage', errorId);
      control.setAttribute('aria-invalid', 'true');
      return;
    }

    if (describedBy.length) control.setAttribute('aria-describedby', describedBy.join(' '));
    else control.removeAttribute('aria-describedby');
    if (control.getAttribute('aria-errormessage') === errorId)
      control.removeAttribute('aria-errormessage');
    if (control.getAttribute('aria-invalid') === 'true') control.removeAttribute('aria-invalid');
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
