export type NavigationIcon =
  | 'layout-dashboard'
  | 'utensils'
  | 'tags'
  | 'calendar-check'
  | 'calendar-days'
  | 'boxes'
  | 'truck'
  | 'briefcase-business'
  | 'users'
  | 'chart-no-axes-combined'
  | 'user-round-cog';

export interface NavigationItem {
  label: string;
  href: string;
  icon: NavigationIcon;
  permission?: string;
  description?: string;
}

export const navigationItems: NavigationItem[] = [
  { label: 'Inicio', href: '/dashboard', icon: 'layout-dashboard' },
  { label: 'Menú / Productos', href: '/productos', icon: 'utensils', permission: 'catalog.read' },
  { label: 'Categorías', href: '/categorias', icon: 'tags', permission: 'catalog.read' },
  {
    label: 'Reservaciones',
    href: '/reservaciones',
    icon: 'calendar-check',
    permission: 'reservations.read',
  },
  { label: 'Eventos', href: '/eventos', icon: 'calendar-days', permission: 'events.read' },
  { label: 'Inventario', href: '/inventario', icon: 'boxes', permission: 'inventory.read' },
  {
    label: 'Proveedores',
    href: '/proveedores',
    icon: 'truck',
    permission: 'inventory.read',
  },
  { label: 'Empleados', href: '/empleados', icon: 'briefcase-business', permission: 'users.read' },
  { label: 'Usuarios', href: '/usuarios', icon: 'users', permission: 'users.read' },
  {
    label: 'Reportes',
    href: '/reportes',
    icon: 'chart-no-axes-combined',
    permission: 'reports.read',
  },
  {
    label: 'Perfil',
    href: '/perfil',
    icon: 'user-round-cog',
    permission: 'auth.password.change',
  },
];

export function hasPermission(permissions: readonly string[], permission?: string): boolean {
  return !permission || permissions.includes(permission);
}

export function filterNavigation(permissions: readonly string[]): NavigationItem[] {
  return navigationItems.filter((item) => hasPermission(permissions, item.permission));
}

export function requiredPermissionForPath(pathname: string): string | undefined {
  const item = navigationItems
    .filter((candidate) => pathname === candidate.href || pathname.startsWith(`${candidate.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0];

  return item?.permission;
}
