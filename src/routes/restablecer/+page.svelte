<script lang="ts">
  /**
   * Restablecimiento de contraseña vía token en query: validación en cliente con indicador
   * de fortaleza y envío a la action por defecto de `/restablecer`.
   */
  import { resolve } from '$app/paths';

  import { Button } from '$lib/components/ui/button/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import PasswordInput from '$lib/components/ui/password-input.svelte';
  import { passwordStrengthScore } from '$lib/validation/auth';
  import { FORM_LIMITS } from '$lib/validation/limits';
  import {
    fieldError as getFieldError,
    globalErrors as getGlobalErrors,
  } from '$lib/validation/errors';
  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
  let newPassword = $state('');
  /** Puntuación heurística solo informativa; la API valida la política real al guardar. */
  const strength = $derived(passwordStrengthScore(newPassword));
  const strengthLabel = $derived(
    ['Muy débil', 'Básica', 'Aceptable', 'Fuerte'][strength] ?? 'Muy débil',
  );

  /** Obtiene el error de un campo tras enviar el formulario de restablecimiento. */
  function fieldError(name: string): string {
    return getFieldError(form?.errors, name);
  }
</script>

<svelte:head>
  <title>Koffi-Soft | Restablecer contraseña</title>
  <meta name="description" content="Restablece el acceso al panel privado de Koffi-Soft." />
</svelte:head>

<main class="login-page">
  <section class="login-card" aria-labelledby="reset-title">
    <div class="login-card__visual">
      <img
        class="login-card__cup"
        src="/brand/cup-login.png"
        alt="Ilustración de una taza de café"
      />
    </div>
    <div class="login-card__content">
      <img class="login-card__brand" src="/brand/logo-primary.png" alt="Koffi-Soft" />
      <p class="login-card__eyebrow">Acceso</p>
      <h1 class="login-card__title" id="reset-title">Restablecer contraseña</h1>
      {#if form?.success}
        <p class="login-card__description">
          La contraseña se actualizó. Inicia sesión con la nueva clave. Las sesiones anteriores
          quedaron cerradas.
        </p>
        <div class="login-card__actions">
          <a class="login-card__secondary" href={resolve('/')}>Ir al inicio de sesión</a>
        </div>
      {:else if !data.token}
        <p class="login-card__description">
          El enlace no incluye un token válido. Solicita de nuevo el restablecimiento desde el
          inicio de sesión.
        </p>
        <div class="login-card__actions">
          <a class="login-card__secondary" href={resolve('/?recuperar=1')}>Solicitar enlace</a>
        </div>
      {:else}
        <p class="login-card__description">
          Elige una contraseña de al menos 12 caracteres que combine letras y números.
        </p>
        <form class="login-card__form" method="POST" autocomplete="on">
          <input type="hidden" name="token" value={data.token} />
          <FormField
            id="reset-password"
            label="Nueva contraseña"
            required
            class="login-card__field"
            error={fieldError('newPassword')}
          >
            <PasswordInput
              id="reset-password"
              name="newPassword"
              bind:value={newPassword}
              minlength={FORM_LIMITS.passwordReset.newPasswordMinLength}
              maxlength={FORM_LIMITS.passwordReset.newPasswordMaxLength}
              placeholder="Escribe una contraseña fuerte"
              autocomplete="new-password"
              required
              invalid={Boolean(fieldError('newPassword'))}
              describedBy={fieldError('newPassword') ? 'reset-password-error' : 'reset-strength'}
            />
          </FormField>
          <p id="reset-strength" class="form-legend">Fortaleza: {strengthLabel}</p>
          <FormField
            id="reset-confirm"
            label="Confirmar contraseña"
            required
            class="login-card__field"
            error={fieldError('confirmPassword')}
          >
            <PasswordInput
              id="reset-confirm"
              name="confirmPassword"
              minlength={FORM_LIMITS.passwordReset.newPasswordMinLength}
              maxlength={FORM_LIMITS.passwordReset.newPasswordMaxLength}
              placeholder="Repite la contraseña"
              autocomplete="new-password"
              required
              invalid={Boolean(fieldError('confirmPassword'))}
              describedBy={fieldError('confirmPassword') ? 'reset-confirm-error' : undefined}
            />
          </FormField>
          {#if getGlobalErrors(form?.errors).length}
            <div class="login-card__error" role="alert">
              {#each getGlobalErrors(form?.errors) as message (message)}<p>{message}</p>{/each}
            </div>
          {/if}
          <p class="form-legend">
            <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
          </p>
          <Button class="login-card__submit" type="submit">Guardar contraseña</Button>
        </form>
      {/if}
    </div>
  </section>
</main>
