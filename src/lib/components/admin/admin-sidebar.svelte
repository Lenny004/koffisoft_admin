<script lang="ts">
  import {
    BriefcaseBusiness,
    Boxes,
    CalendarCheck,
    CalendarDays,
    ChartNoAxesCombined,
    LayoutDashboard,
    LogOut,
    Tags,
    Truck,
    UserRoundCog,
    Users,
    Utensils,
    X,
  } from '@lucide/svelte';
  import { resolve } from '$app/paths';
  import type { RouteId } from '$app/types';
  import { page } from '$app/state';
  import { filterNavigation, type NavigationIcon } from '$lib/config/navigation';
  import type { AuthenticatedUser } from '$lib/types/auth';
  import { displayUserName } from '$lib/types/auth';

  interface Props {
    user: AuthenticatedUser;
    permissions: string[];
    mobile?: boolean;
    closeMenu?: () => void;
  }

  let { user, permissions, mobile = false, closeMenu = () => {} }: Props = $props();

  const iconMap = {
    'layout-dashboard': LayoutDashboard,
    utensils: Utensils,
    tags: Tags,
    'calendar-check': CalendarCheck,
    'calendar-days': CalendarDays,
    boxes: Boxes,
    truck: Truck,
    'briefcase-business': BriefcaseBusiness,
    users: Users,
    'chart-no-axes-combined': ChartNoAxesCombined,
    'user-round-cog': UserRoundCog,
  } satisfies Record<NavigationIcon, typeof LayoutDashboard>;

  const items = $derived(filterNavigation(permissions));

  function isActive(href: string): boolean {
    return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
  }
</script>

<aside
  class:admin-sidebar--mobile={mobile}
  class:admin-sidebar--desktop={!mobile}
  class="admin-sidebar"
>
  <div class="admin-sidebar__brand">
    <img class="admin-sidebar__logo" src="/brand/logo-light.png" alt="Koffi-Soft" />
    {#if mobile}
      <button
        class="admin-sidebar__close"
        type="button"
        aria-label="Cerrar menú"
        onclick={closeMenu}
      >
        <X class="admin-sidebar__icon" aria-hidden="true" />
      </button>
    {/if}
  </div>

  <nav class="admin-sidebar__nav" aria-label="Navegación principal">
    {#each items as item (item.href)}
      {@const Icon = iconMap[item.icon]}
      <a
        class="admin-sidebar__link"
        href={resolve(item.href as RouteId)}
        aria-label={item.label}
        aria-current={isActive(item.href) ? 'page' : undefined}
        onclick={closeMenu}
      >
        <Icon class="admin-sidebar__icon" aria-hidden="true" />
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>

  <div class="admin-sidebar__footer">
    <span class="sr-only">Sesión iniciada como {displayUserName(user)}</span>
    <form method="POST" action="/?/logout">
      <button class="admin-sidebar__logout" type="submit">
        <LogOut class="admin-sidebar__icon" aria-hidden="true" />
        <span>Cerrar sesión</span>
      </button>
    </form>
  </div>
</aside>
