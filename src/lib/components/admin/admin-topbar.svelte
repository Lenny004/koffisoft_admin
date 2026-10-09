<script lang="ts">
  import { ChevronDown, Menu, Moon, Sun } from '@lucide/svelte';
  import { resolve } from '$app/paths';
  import { onMount } from 'svelte';
  import { page } from '$app/state';

  import type { AuthenticatedUser } from '$lib/types/auth';
  import { displayUserName } from '$lib/types/auth';

  interface Props {
    user: AuthenticatedUser;
    openMenu: () => void;
  }

  let { user, openMenu }: Props = $props();
  let dark = $state(false);

  const titles: Record<string, string> = {
    '/dashboard': 'Área personal',
    '/productos': 'Menú / Productos',
    '/categorias': 'Categorías',
    '/reservaciones': 'Reservaciones',
    '/eventos': 'Eventos',
    '/inventario': 'Inventario',
    '/proveedores': 'Proveedores',
    '/empleados': 'Empleados',
    '/usuarios': 'Usuarios',
    '/reportes': 'Reportes',
    '/perfil': 'Perfil',
  };

  const title = $derived(titles[page.url.pathname] ?? 'Koffi-Soft Admin');
  const today = new Intl.DateTimeFormat('es-SV', { dateStyle: 'full' }).format(new Date());

  onMount(() => {
    const savedTheme = localStorage.getItem('koffisoft-theme');
    dark = savedTheme === 'dark' || document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  });

  function toggleTheme() {
    dark = !dark;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('koffisoft-theme', dark ? 'dark' : 'light');
  }
</script>

<header class="admin-topbar">
  <div class="admin-topbar__leading">
    <button class="admin-topbar__menu" type="button" aria-label="Abrir menú" onclick={openMenu}>
      <Menu aria-hidden="true" />
    </button>
    <div>
      <h1 class="admin-topbar__heading">{title}</h1>
      <span class="admin-topbar__date">{today}</span>
    </div>
  </div>

  <div class="admin-topbar__actions">
    <button
      class="admin-topbar__icon-button"
      type="button"
      aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
      aria-pressed={dark}
      onclick={toggleTheme}
    >
      {#if dark}
        <Sun aria-hidden="true" />
      {:else}
        <Moon aria-hidden="true" />
      {/if}
    </button>

    <details class="admin-topbar__profile">
      <summary class="admin-topbar__profile-summary" aria-label="Abrir menú de perfil">
        <span class="admin-topbar__user">
          <img class="admin-topbar__avatar" src="/fixtures/users/admin-avatar.jpg" alt="" />
          <span class="sr-only">{displayUserName(user)}</span>
        </span>
        <ChevronDown class="admin-topbar__profile-icon" aria-hidden="true" />
      </summary>
      <div class="admin-topbar__profile-menu">
        <a class="admin-topbar__profile-link" href={resolve('/perfil')}>Mi perfil</a>
        <form method="POST" action="/?/logout">
          <button class="admin-topbar__profile-link" type="submit">Cerrar sesión</button>
        </form>
      </div>
    </details>
  </div>
</header>
