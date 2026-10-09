<script lang="ts">
  import type { PageProps } from './$types';
  import { displayUserName } from '$lib/types/auth';
  import { Button } from '$lib/components/ui/button/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import { FORM_LIMITS } from '$lib/validation/limits';

  interface ProfileForm {
    errors?: Record<string, string> | string[];
    success?: boolean;
  }

  let { data, form }: { data: PageProps['data']; form?: ProfileForm | null } = $props();

  function fieldError(name: string): string {
    const errors = form?.errors;
    return errors && typeof errors === 'object' && !Array.isArray(errors)
      ? (errors[name] ?? '')
      : '';
  }

  function globalErrors(): string[] {
    const errors = form?.errors;
    if (!errors) return [];
    return Array.isArray(errors) ? errors : [];
  }
</script>

<svelte:head><title>Perfil | Koffi-Soft Admin</title></svelte:head>

<section class="profile-page" aria-labelledby="profile-title">
  <header class="page-header">
    <div>
      <p class="page-header__eyebrow">Área personal</p>
      <h2 class="page-header__title" id="profile-title">Perfil de {displayUserName(data.user!)}</h2>
      <p class="page-header__description">
        La sesión se administra con una cookie HttpOnly; aquí solo se muestran datos entregados por <code
          >/auth/me</code
        >.
      </p>
    </div>
  </header>

  <article class="profile-page__card">
    <h3>Cambiar contraseña</h3>
    <p class="form-legend">
      <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
    </p>
    {#if form?.success}<p class="profile-page__success" role="status">
        La contraseña se actualizó correctamente.
      </p>{/if}
    {#if globalErrors().length}<div class="profile-page__error" role="alert">
        {#each globalErrors() as message (message)}<p>{message}</p>{/each}
      </div>{/if}
    <form class="profile-page__form" method="POST" action="?/changePassword">
      <div class="profile-page__fields">
        <FormField
          id="profile-current-password"
          label="Contraseña actual"
          required
          class="profile-page__field"
          error={fieldError('currentPassword')}
        >
          <input
            class="profile-page__input"
            id="profile-current-password"
            name="currentPassword"
            type="password"
            minlength={FORM_LIMITS.auth.passwordMinLength}
            maxlength={FORM_LIMITS.auth.passwordMaxLength}
            placeholder="Contraseña actual"
            required
            aria-invalid={Boolean(fieldError('currentPassword'))}
            aria-describedby={fieldError('currentPassword')
              ? 'profile-current-password-error'
              : undefined}
          />
        </FormField>
        <FormField
          id="profile-new-password"
          label="Nueva contraseña"
          required
          class="profile-page__field"
          error={fieldError('newPassword')}
        >
          <input
            class="profile-page__input"
            id="profile-new-password"
            name="newPassword"
            type="password"
            minlength={FORM_LIMITS.auth.passwordMinLength}
            maxlength={FORM_LIMITS.auth.passwordMaxLength}
            placeholder="Nueva contraseña"
            required
            aria-invalid={Boolean(fieldError('newPassword'))}
            aria-describedby={fieldError('newPassword') ? 'profile-new-password-error' : undefined}
          />
        </FormField>
        <FormField
          id="profile-confirm-password"
          label="Confirmar nueva contraseña"
          required
          class="profile-page__field"
          error={fieldError('confirmPassword')}
        >
          <input
            class="profile-page__input"
            id="profile-confirm-password"
            name="confirmPassword"
            type="password"
            minlength={FORM_LIMITS.auth.passwordMinLength}
            maxlength={FORM_LIMITS.auth.passwordMaxLength}
            placeholder="Repite la nueva contraseña"
            required
            aria-invalid={Boolean(fieldError('confirmPassword'))}
            aria-describedby={fieldError('confirmPassword')
              ? 'profile-confirm-password-error'
              : undefined}
          />
        </FormField>
      </div>
      <Button class="login-card__submit" type="submit">Guardar contraseña</Button>
    </form>
  </article>
</section>
