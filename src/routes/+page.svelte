<script lang="ts">
  import { resolve } from '$app/paths';
  import { Button } from '$lib/components/ui/button/index.js';
  import FormField from '$lib/components/ui/form-field.svelte';
  import PasswordInput from '$lib/components/ui/password-input.svelte';
  import { FORM_LIMITS } from '$lib/validation/limits';
  import {
    fieldError as getFieldError,
    globalErrors as getGlobalErrors,
  } from '$lib/validation/errors';

  type LoginStep =
    'bootstrap' | 'login' | 'forgot' | 'totp' | 'setup' | 'confirm' | 'recovery' | 'password';
  interface LoginForm {
    step?: LoginStep;
    errors?: Record<string, string> | string[];
    values?: Record<string, string>;
    uri?: string;
    label?: string;
    recoveryCodes?: string[];
    returnTo?: string;
    success?: boolean;
    message?: string;
  }

  let {
    data,
    form,
  }: {
    data: { setupRequired: boolean; showForgot: boolean; returnTo: string };
    form?: LoginForm | null;
  } = $props();
  const step = $derived<LoginStep>(
    form?.step ?? (data.setupRequired ? 'bootstrap' : data.showForgot ? 'forgot' : 'login'),
  );
  const destination = $derived(form?.returnTo ?? data.returnTo);

  function fieldError(name: string): string {
    return getFieldError(form?.errors, name);
  }

  function globalErrors(): string[] {
    return getGlobalErrors(form?.errors);
  }

  function formValue(name: string): string {
    return form?.values?.[name] ?? '';
  }
</script>

<svelte:head>
  <title>
    Koffi-Soft | {step === 'bootstrap'
      ? 'Primer uso'
      : step === 'forgot'
        ? 'Contraseña'
        : 'Iniciar sesión'}
  </title>
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

      {#if step === 'bootstrap'}
        <p class="login-card__eyebrow">Primer uso</p>
        <h1 class="login-card__title" id="login-title">Configura el propietario</h1>
        <p class="login-card__description">
          Esta cuenta se crea una sola vez. Después el panel solo muestra el inicio de sesión.
        </p>
        <form class="login-card__form" method="POST" action="?/bootstrap" autocomplete="on">
          <input type="hidden" name="returnTo" value={destination} />
          <div class="login-card__fields">
            <FormField
              id="setup-first-name"
              label="Nombre"
              required
              class="login-card__field"
              error={fieldError('firstName')}
            >
              <input
                class="login-card__input"
                id="setup-first-name"
                name="firstName"
                value={formValue('firstName')}
                maxlength={FORM_LIMITS.auth.personNameMaxLength}
                placeholder="Ej. Ana"
                autocomplete="given-name"
                required
                aria-invalid={Boolean(fieldError('firstName'))}
                aria-describedby={fieldError('firstName') ? 'setup-first-name-error' : undefined}
              />
            </FormField>
            <FormField
              id="setup-last-name"
              label="Apellido"
              required
              class="login-card__field"
              error={fieldError('lastName')}
            >
              <input
                class="login-card__input"
                id="setup-last-name"
                name="lastName"
                value={formValue('lastName')}
                maxlength={FORM_LIMITS.auth.personNameMaxLength}
                placeholder="Ej. López"
                autocomplete="family-name"
                required
                aria-invalid={Boolean(fieldError('lastName'))}
                aria-describedby={fieldError('lastName') ? 'setup-last-name-error' : undefined}
              />
            </FormField>
            <FormField
              id="setup-email"
              label="Correo electrónico"
              required
              class="login-card__field"
              error={fieldError('email')}
            >
              <input
                class="login-card__input"
                id="setup-email"
                name="email"
                type="email"
                value={formValue('email')}
                placeholder="Ej. ana@koffisoft.com"
                maxlength={FORM_LIMITS.auth.emailMaxLength}
                autocomplete="username"
                required
                aria-invalid={Boolean(fieldError('email'))}
                aria-describedby={fieldError('email') ? 'setup-email-error' : undefined}
              />
            </FormField>
            <FormField
              id="setup-password"
              label="Contraseña"
              required
              class="login-card__field"
              error={fieldError('password')}
            >
              <PasswordInput
                id="setup-password"
                name="password"
                value={formValue('password')}
                minlength={FORM_LIMITS.auth.passwordMinLength}
                maxlength={FORM_LIMITS.auth.passwordMaxLength}
                placeholder="Mínimo 12 caracteres"
                autocomplete="new-password"
                required
                invalid={Boolean(fieldError('password'))}
                describedBy={fieldError('password') ? 'setup-password-error' : undefined}
              />
            </FormField>
            <FormField
              id="setup-confirm-password"
              label="Confirma la contraseña"
              required
              class="login-card__field"
              error={fieldError('confirmPassword')}
            >
              <PasswordInput
                id="setup-confirm-password"
                name="confirmPassword"
                value={formValue('confirmPassword')}
                minlength={FORM_LIMITS.auth.passwordMinLength}
                maxlength={FORM_LIMITS.auth.passwordMaxLength}
                placeholder="Repite la contraseña"
                autocomplete="new-password"
                required
                invalid={Boolean(fieldError('confirmPassword'))}
                describedBy={fieldError('confirmPassword')
                  ? 'setup-confirm-password-error'
                  : undefined}
              />
            </FormField>
          </div>
          {#if globalErrors().length}<div class="login-card__error" role="alert">
              {#each globalErrors() as message (message)}<p>{message}</p>{/each}
            </div>{/if}
          <Button class="login-card__submit" type="submit">Crear propietario</Button>
        </form>
      {:else if step === 'forgot'}
        <p class="login-card__eyebrow">Acceso</p>
        <h1 class="login-card__title" id="login-title">Olvidé mi contraseña</h1>
        <p class="login-card__description">
          Escribe el correo de tu cuenta. Si existe, la API enviará instrucciones de recuperación.
          El mensaje es el mismo en todos los casos.
        </p>
        {#if form?.success && form.message}
          <div class="login-card__error" role="status">
            <p>{form.message}</p>
          </div>
        {:else}
          <form class="login-card__form" method="POST" action="?/forgot" autocomplete="on">
            <input type="hidden" name="returnTo" value={destination} />
            <FormField
              id="forgot-email"
              label="Correo electrónico"
              required
              class="login-card__field"
              error={fieldError('email')}
            >
              <input
                class="login-card__input"
                id="forgot-email"
                name="email"
                type="email"
                value={formValue('email')}
                placeholder="Ej. admin@koffisoft.com"
                maxlength={FORM_LIMITS.auth.emailMaxLength}
                autocomplete="username"
                required
              />
            </FormField>
            {#if globalErrors().length}<div class="login-card__error" role="alert">
                {#each globalErrors() as message (message)}<p>{message}</p>{/each}
              </div>{/if}
            <Button class="login-card__submit" type="submit">Enviar instrucciones</Button>
          </form>
        {/if}
        <div class="login-card__actions">
          <a
            class="login-card__secondary"
            href={resolve(
              (destination ? `/?returnTo=${encodeURIComponent(destination)}` : '/') as '/',
            )}>Volver al inicio de sesión</a
          >
        </div>
      {:else if step === 'login'}
        <p class="login-card__eyebrow">Panel privado</p>
        <h1 class="login-card__title" id="login-title">Iniciar sesión</h1>
        <p class="login-card__description">
          Administra el catálogo y la operación diaria de Koffi-Soft.
        </p>
        <form class="login-card__form" method="POST" action="?/login" autocomplete="on">
          <input type="hidden" name="returnTo" value={destination} />
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
              <PasswordInput
                id="login-password"
                name="password"
                value={formValue('password')}
                minlength={FORM_LIMITS.auth.passwordMinLength}
                maxlength={FORM_LIMITS.auth.passwordMaxLength}
                placeholder="Escribe tu contraseña"
                autocomplete="current-password"
                required
                invalid={Boolean(fieldError('password'))}
                describedBy={fieldError('password') ? 'login-password-error' : undefined}
              />
            </FormField>
          </div>
          {#if globalErrors().length}<div class="login-card__error" role="alert">
              {#each globalErrors() as message (message)}<p>{message}</p>{/each}
            </div>{/if}
          <Button class="login-card__submit" type="submit">Continuar</Button>
        </form>
        <form class="login-card__actions" method="GET" action={resolve('/')}>
          <input type="hidden" name="recuperar" value="1" />
          <input type="hidden" name="returnTo" value={destination} />
          <Button class="login-card__link" variant="link" type="submit">Olvidé mi contraseña</Button
          >
        </form>
      {:else if step === 'totp'}
        <p class="login-card__eyebrow">Segundo factor</p>
        <h1 class="login-card__title" id="login-title">Verifica tu acceso</h1>
        <p class="login-card__description">
          Escribe el código de seis dígitos de tu aplicación autenticadora.
        </p>
        <form class="login-card__form" method="POST" action="?/verifyMfa">
          <input type="hidden" name="returnTo" value={destination} />
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
          <input type="hidden" name="returnTo" value={destination} />
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
          <input type="hidden" name="returnTo" value={destination} />
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
          <input type="hidden" name="uri" value={form?.uri ?? ''} />
          <input type="hidden" name="returnTo" value={destination} />
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
          <a
            class="login-card__secondary"
            href={resolve((destination || '/dashboard') as '/dashboard')}>Entrar al panel</a
          >
        </div>
      {:else if step === 'password'}
        <p class="login-card__eyebrow">Acción requerida</p>
        <h1 class="login-card__title" id="login-title">Actualiza tu contraseña</h1>
        <p class="login-card__description">
          La API indicó que necesitas cambiar tu contraseña antes de continuar.
        </p>
        <form class="login-card__form" method="POST" action="?/changePassword">
          <input type="hidden" name="returnTo" value={destination} />
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
