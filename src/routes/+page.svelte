<script lang="ts">
  import { resolve } from '$app/paths';

  type LoginStep = 'login' | 'totp' | 'setup' | 'confirm' | 'recovery' | 'password';
  interface LoginForm {
    step?: LoginStep;
    errors?: string[];
    email?: string;
    uri?: string;
    label?: string;
    recoveryCodes?: string[];
  }

  let { form }: { form?: LoginForm | null } = $props();
  const step = $derived(form?.step ?? 'login');
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
          <div class="login-card__fields">
            <div class="login-card__field">
              <label class="login-card__label" for="login-email">Correo electrónico</label>
              <input
                class="login-card__input"
                id="login-email"
                name="email"
                type="email"
                value={form?.email ?? ''}
                autocomplete="username"
                required
              />
            </div>
            <div class="login-card__field">
              <label class="login-card__label" for="login-password">Contraseña</label>
              <input
                class="login-card__input"
                id="login-password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
              />
            </div>
          </div>

          {#if form?.errors?.length}
            <div class="login-card__error" role="alert">
              {#each form.errors as message (message)}<p>{message}</p>{/each}
            </div>
          {/if}

          <button class="login-card__submit" type="submit">Continuar</button>
        </form>
      {:else if step === 'totp'}
        <p class="login-card__eyebrow">Segundo factor</p>
        <h1 class="login-card__title" id="login-title">Verifica tu acceso</h1>
        <p class="login-card__description">
          Escribe el código de seis dígitos de tu aplicación autenticadora.
        </p>

        <form class="login-card__form" method="POST" action="?/verifyMfa">
          <div class="login-card__field">
            <label class="login-card__label" for="totp-code">Código TOTP</label>
            <input
              class="login-card__input"
              id="totp-code"
              name="code"
              inputmode="numeric"
              maxlength="6"
              required
            />
          </div>
          {#if form?.errors?.length}
            <div class="login-card__error" role="alert">
              {#each form.errors as message (message)}<p>{message}</p>{/each}
            </div>
          {/if}
          <button class="login-card__submit" type="submit">Verificar código</button>
        </form>

        <form class="login-card__actions" method="POST" action="?/recoverMfa">
          <label class="login-card__label" for="recovery-code">¿No tienes tu aplicación?</label>
          <input
            class="login-card__input"
            id="recovery-code"
            name="code"
            minlength="20"
            placeholder="Código de recuperación"
          />
          <button class="login-card__secondary" type="submit">Usar recuperación</button>
        </form>
      {:else if step === 'setup'}
        <p class="login-card__eyebrow">Protege tu cuenta</p>
        <h1 class="login-card__title" id="login-title">Configura autenticación en dos pasos</h1>
        <p class="login-card__description">
          La API exige registrar un factor TOTP antes de entrar al panel.
        </p>

        <form class="login-card__form" method="POST" action="?/setupMfa">
          <div class="login-card__field">
            <label class="login-card__label" for="mfa-label">Nombre del dispositivo</label>
            <input
              class="login-card__input"
              id="mfa-label"
              name="label"
              value="Teléfono principal"
              maxlength="100"
            />
          </div>
          <button class="login-card__submit" type="submit">Generar configuración</button>
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
          <div class="login-card__field">
            <label class="login-card__label" for="confirm-code">Código TOTP</label>
            <input
              class="login-card__input"
              id="confirm-code"
              name="code"
              inputmode="numeric"
              maxlength="6"
              required
            />
          </div>
          {#if form?.errors?.length}
            <div class="login-card__error" role="alert">
              {#each form.errors as message (message)}<p>{message}</p>{/each}
            </div>
          {/if}
          <button class="login-card__submit" type="submit">Activar autenticación</button>
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
          <div class="login-card__field">
            <label class="login-card__label" for="current-password">Contraseña actual</label>
            <input
              class="login-card__input"
              id="current-password"
              name="currentPassword"
              type="password"
              minlength="12"
              required
            />
          </div>
          <div class="login-card__field">
            <label class="login-card__label" for="new-password">Nueva contraseña</label>
            <input
              class="login-card__input"
              id="new-password"
              name="newPassword"
              type="password"
              minlength="12"
              required
            />
          </div>
          <div class="login-card__field">
            <label class="login-card__label" for="confirm-password"
              >Confirma la nueva contraseña</label
            >
            <input
              class="login-card__input"
              id="confirm-password"
              name="confirmPassword"
              type="password"
              minlength="12"
              required
            />
          </div>
          {#if form?.errors?.length}
            <div class="login-card__error" role="alert">
              {#each form.errors as message (message)}<p>{message}</p>{/each}
            </div>
          {/if}
          <button class="login-card__submit" type="submit">Guardar contraseña</button>
        </form>
      {/if}
    </div>
  </section>
</main>
