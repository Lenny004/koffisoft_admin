<script lang="ts">
  import type { PageProps } from './$types';
  import { displayUserName } from '$lib/types/auth';

  interface ProfileForm {
    errors?: string[];
    success?: boolean;
  }

  let { data, form }: { data: PageProps['data']; form?: ProfileForm | null } = $props();
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
    {#if form?.success}
      <p class="profile-page__success" role="status">La contraseña se actualizó correctamente.</p>
    {/if}
    {#if form?.errors?.length}
      <div class="profile-page__error" role="alert">
        {#each form.errors as message (message)}<p>{message}</p>{/each}
      </div>
    {/if}
    <form class="profile-page__form" method="POST" action="?/changePassword">
      <div class="profile-page__fields">
        <div class="profile-page__field">
          <label class="profile-page__label" for="profile-current-password">Contraseña actual</label
          >
          <input
            class="profile-page__input"
            id="profile-current-password"
            name="currentPassword"
            type="password"
            minlength="12"
            required
          />
        </div>
        <div class="profile-page__field">
          <label class="profile-page__label" for="profile-new-password">Nueva contraseña</label>
          <input
            class="profile-page__input"
            id="profile-new-password"
            name="newPassword"
            type="password"
            minlength="12"
            required
          />
        </div>
        <div class="profile-page__field">
          <label class="profile-page__label" for="profile-confirm-password"
            >Confirmar nueva contraseña</label
          >
          <input
            class="profile-page__input"
            id="profile-confirm-password"
            name="confirmPassword"
            type="password"
            minlength="12"
            required
          />
        </div>
      </div>
      <button class="login-card__submit" type="submit">Guardar contraseña</button>
    </form>
  </article>
</section>
