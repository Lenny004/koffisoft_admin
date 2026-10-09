<script lang="ts">
  import type { Snippet } from 'svelte';

  import AdminFooter from './admin-footer.svelte';
  import AdminSidebar from './admin-sidebar.svelte';
  import AdminTopbar from './admin-topbar.svelte';
  import type { AuthenticatedUser } from '$lib/types/auth';

  interface Props {
    user: AuthenticatedUser;
    permissions: string[];
    children: Snippet;
  }

  let { user, permissions, children }: Props = $props();
  let menuOpen = $state(false);
</script>

<div class:is-menu-open={menuOpen} class="admin-shell">
  <div class="admin-shell__backdrop" role="presentation" onclick={() => (menuOpen = false)}></div>
  <AdminSidebar {user} {permissions} />
  <AdminSidebar {user} {permissions} mobile closeMenu={() => (menuOpen = false)} />

  <div class="admin-shell__main">
    <AdminTopbar {user} openMenu={() => (menuOpen = true)} />
    <main class="admin-shell__content">{@render children()}</main>
    <AdminFooter />
  </div>
</div>
