<script lang="ts">
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import { FORM_LIMITS } from '$lib/validation/limits';

  type LoginStep = 'login' | 'totp' | 'setup' | 'confirm' | 'recovery' | 'password';
  interface LoginForm {
    step?: LoginStep;
    errors?: Record<string, string> | string[];
    values?: Record<string, string>;
    uri?: string;
    label?: string;
    recoveryCodes?: string[];
  }

  let { form }: { form?: LoginForm | null } = $props();
  const step = $derived(form?.step ?? 'login');

  function fieldError(name: string): string {
    return form?.errors && !Array.isArray(form.errors) ? (form.errors[name] ?? '') : '';
  }

  function globalErrors(): string[] {
    if (!form?.errors) return [];
    return Array.isArray(form.errors) ? form.errors : form.errors._form ? [form.errors._form] : [];
  }

  function formValue(name: string): string {
    return form?.values?.[name] ?? '';
  }
</script>

<svelte:head>
  <title>Koffi-Soft | Iniciar sesión</title>
  <meta name="description" content="Acceso seguro al panel privado de Koffi-Soft." />
</svelte:head>

<main class="login-page">
  <section class="login-card" aria-labelledby="login-title">
    <div class="login-card__visual">
      <img
        class="login-card__cup"
        src="/brand/cup-login.png"
        alt="Ilustración de una taza de café"
      />
    </div>
    <div class="login-card__content">
      <img class="login-card__brand" src="/brand/logo-primary.png" alt="Koffi-Soft" />

      {#if step === 'login'}
        <p class="login-card__eyebrow">Panel privado</p>
        <h1 class="login-card__title" id="login-title">Iniciar sesión</h1>
        <p class="login-card__description">
          Administra el catálogo y la operación diaria de Koffi-Soft.
        </p>
        <form class="login-card__form" method="POST" action="?/login" autocomplete="on">
          <p class="form-legend">
            <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
          </p>
          <div class="login-card__fields">
            <FormField
              id="login-email"
              label="Correo electrónico"
              required
              class="login-card__field"
              error={fieldError('email')}
            >
              <input
                class="login-card__input"
                id="login-email"
                name="email"
                type="email"
                value={formValue('email')}
                placeholder="Ej. admin@koffisoft.com"
                maxlength={FORM_LIMITS.auth.emailMaxLength}
                autocomplete="username"
                required
                aria-invalid={Boolean(fieldError('email'))}
                aria-describedby={fieldError('email') ? 'login-email-error' : undefined}
              />
            </FormField>
            <FormField
              id="login-password"
              label="Contraseña"
              required
              class="login-card__field"
              error={fieldError('password')}
            >
              <input
                class="login-card__input"
                id="login-password"
                name="password"
                type="password"
                minlength={FORM_LIMITS.auth.passwordMinLength}
                maxlength={FORM_LIMITS.auth.passwordMaxLength}
                placeholder="Escribe tu contraseña"
                autocomplete="current-password"
                required
                aria-invalid={Boolean(fieldError('password'))}
                aria-describedby={fieldError('password') ? 'login-password-error' : undefined}
              />
            </FormField>
          </div>
          {#if globalErrors().length}<div class="login-card__error" role="alert">
              {#each globalErrors() as message (message)}<p>{message}</p>{/each}
            </div>{/if}
          <Button class="login-card__submit" type="submit">Continuar</Button>
        </form>
      {:else if step === 'totp'}
        <p class="login-card__eyebrow">Segundo factor</p>
        <h1 class="login-card__title" id="login-title">Verifica tu acceso</h1>
        <p class="login-card__description">
          Escribe el código de seis dígitos de tu aplicación autenticadora.
        </p>
        <form class="login-card__form" method="POST" action="?/verifyMfa">
          <p class="form-legend">
            <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
          </p>
          <FormField
            id="totp-code"
            label="Código TOTP"
            required
            class="login-card__field"
            error={fieldError('code')}
          >
            <input
              class="login-card__input"
              id="totp-code"
              name="code"
              inputmode="numeric"
              minlength={FORM_LIMITS.auth.totpLength}
              maxlength={FORM_LIMITS.auth.totpLength}
              pattern="[0-9]{6}"
              placeholder="123456"
              autocomplete="one-time-code"
              value={formValue('code')}
              required
              aria-invalid={Boolean(fieldError('code'))}
              aria-describedby={fieldError('code') ? 'totp-code-error' : undefined}
            />
          </FormField>
          {#if globalErrors().length}<div class="login-card__error" role="alert">
              {#each globalErrors() as message (message)}<p>{message}</p>{/each}
            </div>{/if}
          <Button class="login-card__submit" type="submit">Verificar código</Button>
        </form>
        <form class="login-card__actions" method="POST" action="?/recoverMfa">
          <p class="form-legend">
            <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
          </p>
          <FormField
            id="recovery-code"
            label="¿No tienes tu aplicación?"
            required
            class="login-card__field"
            error={fieldError('code')}
          >
            <input
              class="login-card__input"
              id="recovery-code"
              name="code"
              minlength={FORM_LIMITS.auth.recoveryCodeMinLength}
              maxlength={FORM_LIMITS.auth.recoveryCodeMaxLength}
              pattern="[A-Za-z0-9]+"
              autocomplete="one-time-code"
              required
              value={formValue('code')}
              placeholder="Ej. AB12CD34EF56AB78CD90"
              aria-invalid={Boolean(fieldError('code'))}
              aria-describedby={fieldError('code') ? 'recovery-code-error' : undefined}
            />
          </FormField>
          <Button class="login-card__secondary" variant="outline" type="submit"
            >Usar recuperación</Button
          >
        </form>
      {:else if step === 'setup'}
        <p class="login-card__eyebrow">Protege tu cuenta</p>
        <h1 class="login-card__title" id="login-title">Configura autenticación en dos pasos</h1>
        <p class="login-card__description">
          La API exige registrar un factor TOTP antes de entrar al panel.
        </p>
        <form class="login-card__form" method="POST" action="?/setupMfa">
          <p class="form-legend">
            <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio · Campo opcional
          </p>
          <FormField
            id="mfa-label"
            label="Nombre del dispositivo"
            class="login-card__field"
            error={fieldError('label')}
            helpText="Opcional"
          >
            <input
              class="login-card__input"
              id="mfa-label"
              name="label"
              value={formValue('label') || 'Teléfono principal'}
              maxlength={FORM_LIMITS.auth.mfaLabelMaxLength}
              placeholder="Ej. Teléfono principal"
              aria-invalid={Boolean(fieldError('label'))}
              aria-describedby={fieldError('label') ? 'mfa-label-error' : undefined}
            />
          </FormField>
          {#if globalErrors().length}<div class="login-card__error" role="alert">
              {#each globalErrors() as message (message)}<p>{message}</p>{/each}
            </div>{/if}
          <Button class="login-card__submit" type="submit">Generar configuración</Button>
        </form>
      {:else if step === 'confirm'}
        <p class="login-card__eyebrow">Confirma tu autenticador</p>
        <h1 class="login-card__title" id="login-title">Valida el primer código</h1>
        <p class="login-card__description">
          Agrega esta URI en tu aplicación autenticadora y escribe el código generado.
        </p>
        <div class="login-card__notice" role="status">{form?.uri}</div>
        <form class="login-card__form" method="POST" action="?/confirmMfa">
          <p class="form-legend">
            <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
          </p>
          <input type="hidden" name="uri" value={form?.uri ?? ''} />
          <FormField
            id="confirm-code"
            label="Código TOTP"
            required
            class="login-card__field"
            error={fieldError('code')}
          >
            <input
              class="login-card__input"
              id="confirm-code"
              name="code"
              inputmode="numeric"
              minlength={FORM_LIMITS.auth.totpLength}
              maxlength={FORM_LIMITS.auth.totpLength}
              pattern="[0-9]{6}"
              placeholder="123456"
              autocomplete="one-time-code"
              value={formValue('code')}
              required
              aria-invalid={Boolean(fieldError('code'))}
              aria-describedby={fieldError('code') ? 'confirm-code-error' : undefined}
            />
          </FormField>
          {#if globalErrors().length}<div class="login-card__error" role="alert">
              {#each globalErrors() as message (message)}<p>{message}</p>{/each}
            </div>{/if}
          <Button class="login-card__submit" type="submit">Activar autenticación</Button>
        </form>
      {:else if step === 'recovery'}
        <p class="login-card__eyebrow">Configuración completada</p>
        <h1 class="login-card__title" id="login-title">Guarda tus códigos</h1>
        <p class="login-card__description">
          Estos códigos se muestran una sola vez. Guárdalos en un lugar seguro.
        </p>
        <ul class="login-card__recovery-codes">
          {#each form?.recoveryCodes ?? [] as code (code)}<li>{code}</li>{/each}
        </ul>
        <div class="login-card__actions">
          <a class="login-card__secondary" href={resolve('/dashboard')}>Entrar al panel</a>
        </div>
      {:else if step === 'password'}
        <p class="login-card__eyebrow">Acción requerida</p>
        <h1 class="login-card__title" id="login-title">Actualiza tu contraseña</h1>
        <p class="login-card__description">
          La API indicó que necesitas cambiar tu contraseña antes de continuar.
        </p>
        <form class="login-card__form" method="POST" action="?/changePassword">
          <p class="form-legend">
            <span class="form-field__required" aria-hidden="true">*</span> Campo obligatorio
          </p>
          <FormField
            id="current-password"
            label="Contraseña actual"
            required
            class="login-card__field"
            error={fieldError('currentPassword')}
          >
            <input
              class="login-card__input"
              id="current-password"
              name="currentPassword"
              type="password"
              minlength={FORM_LIMITS.auth.passwordMinLength}
              maxlength={FORM_LIMITS.auth.passwordMaxLength}
              placeholder="Contraseña actual"
              required
              aria-invalid={Boolean(fieldError('currentPassword'))}
              aria-describedby={fieldError('currentPassword')
                ? 'current-password-error'
                : undefined}
            />
          </FormField>
          <FormField
            id="new-password"
            label="Nueva contraseña"
            required
            class="login-card__field"
            error={fieldError('newPassword')}
          >
            <input
              class="login-card__input"
              id="new-password"
              name="newPassword"
              type="password"
              minlength={FORM_LIMITS.auth.passwordMinLength}
              maxlength={FORM_LIMITS.auth.passwordMaxLength}
              placeholder="Nueva contraseña"
              required
              aria-invalid={Boolean(fieldError('newPassword'))}
              aria-describedby={fieldError('newPassword') ? 'new-password-error' : undefined}
            />
          </FormField>
          <FormField
            id="confirm-password"
            label="Confirma la nueva contraseña"
            required
            class="login-card__field"
            error={fieldError('confirmPassword')}
          >
            <input
              class="login-card__input"
              id="confirm-password"
              name="confirmPassword"
              type="password"
              minlength={FORM_LIMITS.auth.passwordMinLength}
              maxlength={FORM_LIMITS.auth.passwordMaxLength}
              placeholder="Repite la nueva contraseña"
              required
              aria-invalid={Boolean(fieldError('confirmPassword'))}
              aria-describedby={fieldError('confirmPassword')
                ? 'confirm-password-error'
                : undefined}
            />
          </FormField>
          {#if globalErrors().length}<div class="login-card__error" role="alert">
              {#each globalErrors() as message (message)}<p>{message}</p>{/each}
            </div>{/if}
          <Button class="login-card__submit" type="submit">Guardar contraseña</Button>
        </form>
      {/if}
    </div>
  </section>
</main>
