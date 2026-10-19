<script lang="ts">
  /**
   * Estructura responsive del panel: sidebar, topbar, campana y área de contenido.
   */
  import type { Snippet } from 'svelte';

  import AdminFooter from './admin-footer.svelte';
  import AdminSidebar from './admin-sidebar.svelte';
  import AdminTopbar from './admin-topbar.svelte';
  import type { AuthenticatedUser } from '$lib/types/auth';

  import type { NotificationItem } from '$lib/notifications/types';

  interface Props {
    user: AuthenticatedUser;
    permissions: string[];
    unreadCount?: number;
    latestNotifications?: NotificationItem[];
    children: Snippet;
  }

  let { user, permissions, unreadCount = 0, latestNotifications = [], children }: Props = $props();
  let menuOpen = $state(false);
</script>

<div class:is-menu-open={menuOpen} class="admin-shell">
  <div class="admin-shell__backdrop" role="presentation" onclick={() => (menuOpen = false)}></div>
  <AdminSidebar {user} {permissions} />
  <AdminSidebar {user} {permissions} mobile closeMenu={() => (menuOpen = false)} />

  <div class="admin-shell__main">
    <AdminTopbar
      {user}
      {permissions}
      {unreadCount}
      {latestNotifications}
      openMenu={() => (menuOpen = true)}
    />
    <main class="admin-shell__content">{@render children()}</main>
    <AdminFooter />
  </div>
</div>
