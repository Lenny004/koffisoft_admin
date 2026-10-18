# Checklist documentación (funciones y métodos)

Auditoría: `node scripts/audit-docs.mjs` y `node scripts/generate-checklist.mjs`.
Criterio: bloque `/**` en español inmediatamente encima de cada declaración de función.

## Leyenda

| Símbolo | Significado |
| --- | --- |
| [x] | Todas las funciones detectadas documentadas |
| [~] | Parcial |
| [ ] | Pendiente |
| [-] | Sin funciones declaradas en script/módulo |

## Resumen

| Métrica | Cantidad |
| --- | ---: |
| files | 175 |
| completo | 93 |
| parcial | 0 |
| pendiente | 0 |
| sinFunciones | 82 |

## Archivos

| | Archivo | Funciones | Doc |
| --- | --- | ---: | ---: |
| [-] | `src/app.d.ts` | — | — |
| [x] | `src/hooks.server.ts` | 1 | 1 |
| [-] | `src/lib/analytics/types.ts` | — | — |
| [-] | `src/lib/announcements/types.ts` | — | — |
| [-] | `src/lib/audit/types.ts` | — | — |
| [-] | `src/lib/backups/types.ts` | — | — |
| [-] | `src/lib/components/admin/admin-footer.svelte` | — | — |
| [-] | `src/lib/components/admin/admin-shell.svelte` | — | — |
| [x] | `src/lib/components/admin/admin-sidebar.svelte` | 1 | 1 |
| [x] | `src/lib/components/admin/admin-topbar.svelte` | 1 | 1 |
| [x] | `src/lib/components/admin/audit-log-browser.svelte` | 2 | 2 |
| [x] | `src/lib/components/admin/contact-inbox.svelte` | 8 | 8 |
| [x] | `src/lib/components/admin/employee-directory.svelte` | 9 | 9 |
| [x] | `src/lib/components/admin/event-module.svelte` | 9 | 9 |
| [x] | `src/lib/components/admin/inventory-module.svelte` | 15 | 15 |
| [x] | `src/lib/components/admin/notification-bell.svelte` | 3 | 3 |
| [x] | `src/lib/components/admin/notification-inbox.svelte` | 2 | 2 |
| [x] | `src/lib/components/admin/product-crud.svelte` | 7 | 7 |
| [x] | `src/lib/components/admin/purchase-order-module.svelte` | 9 | 9 |
| [x] | `src/lib/components/admin/reservation-module.svelte` | 9 | 9 |
| [x] | `src/lib/components/admin/resource-directory.svelte` | 7 | 7 |
| [x] | `src/lib/components/admin/supplier-directory.svelte` | 6 | 6 |
| [-] | `src/lib/components/admin/under-construction.svelte` | — | — |
| [x] | `src/lib/components/admin/user-directory.svelte` | 11 | 11 |
| [-] | `src/lib/components/ui/alert/alert.svelte` | — | — |
| [-] | `src/lib/components/ui/alert/index.ts` | — | — |
| [-] | `src/lib/components/ui/badge/badge.svelte` | — | — |
| [-] | `src/lib/components/ui/badge/index.ts` | — | — |
| [-] | `src/lib/components/ui/button/button.svelte` | — | — |
| [-] | `src/lib/components/ui/button/index.ts` | — | — |
| [-] | `src/lib/components/ui/card/card-content.svelte` | — | — |
| [-] | `src/lib/components/ui/card/card-description.svelte` | — | — |
| [-] | `src/lib/components/ui/card/card-header.svelte` | — | — |
| [-] | `src/lib/components/ui/card/card-title.svelte` | — | — |
| [-] | `src/lib/components/ui/card/card.svelte` | — | — |
| [-] | `src/lib/components/ui/card/index.ts` | — | — |
| [-] | `src/lib/components/ui/dialog/body.svelte` | — | — |
| [-] | `src/lib/components/ui/dialog/close.svelte` | — | — |
| [-] | `src/lib/components/ui/dialog/content.svelte` | — | — |
| [-] | `src/lib/components/ui/dialog/description.svelte` | — | — |
| [-] | `src/lib/components/ui/dialog/footer.svelte` | — | — |
| [-] | `src/lib/components/ui/dialog/header.svelte` | — | — |
| [-] | `src/lib/components/ui/dialog/index.ts` | — | — |
| [-] | `src/lib/components/ui/dialog/root.svelte` | — | — |
| [-] | `src/lib/components/ui/dialog/title.svelte` | — | — |
| [-] | `src/lib/components/ui/dialog/trigger.svelte` | — | — |
| [-] | `src/lib/components/ui/dropdown-menu/index.ts` | — | — |
| [x] | `src/lib/components/ui/form-field.svelte` | 1 | 1 |
| [-] | `src/lib/components/ui/input/index.ts` | — | — |
| [-] | `src/lib/components/ui/input/input.svelte` | — | — |
| [-] | `src/lib/components/ui/password-input.svelte` | — | — |
| [x] | `src/lib/components/ui/search-select.svelte` | 1 | 1 |
| [-] | `src/lib/components/ui/table/body.svelte` | — | — |
| [-] | `src/lib/components/ui/table/caption.svelte` | — | — |
| [-] | `src/lib/components/ui/table/cell.svelte` | — | — |
| [-] | `src/lib/components/ui/table/empty.svelte` | — | — |
| [-] | `src/lib/components/ui/table/footer.svelte` | — | — |
| [-] | `src/lib/components/ui/table/head.svelte` | — | — |
| [-] | `src/lib/components/ui/table/header.svelte` | — | — |
| [-] | `src/lib/components/ui/table/index.ts` | — | — |
| [-] | `src/lib/components/ui/table/pagination.svelte` | — | — |
| [-] | `src/lib/components/ui/table/root.svelte` | — | — |
| [-] | `src/lib/components/ui/table/row.svelte` | — | — |
| [x] | `src/lib/config/navigation.ts` | 3 | 3 |
| [x] | `src/lib/contact/types.ts` | 1 | 1 |
| [x] | `src/lib/events/types.ts` | 3 | 3 |
| [-] | `src/lib/fixtures/dashboard.ts` | — | — |
| [-] | `src/lib/fixtures/products.ts` | — | — |
| [x] | `src/lib/formatting/dates.ts` | 5 | 5 |
| [-] | `src/lib/inventory/page-types.ts` | — | — |
| [-] | `src/lib/inventory/types.ts` | — | — |
| [x] | `src/lib/menu/mappers.ts` | 4 | 4 |
| [-] | `src/lib/menu/types.ts` | — | — |
| [-] | `src/lib/notifications/types.ts` | — | — |
| [-] | `src/lib/publication/types.ts` | — | — |
| [-] | `src/lib/purchase-orders/types.ts` | — | — |
| [x] | `src/lib/reservations/types.ts` | 2 | 2 |
| [-] | `src/lib/resources/types.ts` | — | — |
| [-] | `src/lib/seo/types.ts` | — | — |
| [x] | `src/lib/server/analytics.ts` | 8 | 8 |
| [x] | `src/lib/server/announcements.ts` | 7 | 7 |
| [x] | `src/lib/server/api.ts` | 9 | 9 |
| [x] | `src/lib/server/audit-logs.ts` | 3 | 3 |
| [x] | `src/lib/server/auth-hook.ts` | 4 | 4 |
| [x] | `src/lib/server/backups.ts` | 6 | 6 |
| [x] | `src/lib/server/contact.ts` | 8 | 8 |
| [x] | `src/lib/server/events.ts` | 22 | 22 |
| [x] | `src/lib/server/inventory.ts` | 23 | 23 |
| [x] | `src/lib/server/menu.ts` | 20 | 20 |
| [x] | `src/lib/server/notifications.ts` | 6 | 6 |
| [x] | `src/lib/server/publication.ts` | 5 | 5 |
| [x] | `src/lib/server/purchase-orders.ts` | 15 | 15 |
| [x] | `src/lib/server/query.ts` | 1 | 1 |
| [x] | `src/lib/server/reservations.ts` | 16 | 16 |
| [x] | `src/lib/server/resources.ts` | 10 | 10 |
| [x] | `src/lib/server/return-to.ts` | 1 | 1 |
| [x] | `src/lib/server/seo.ts` | 7 | 7 |
| [x] | `src/lib/server/site.ts` | 4 | 4 |
| [x] | `src/lib/server/users.ts` | 17 | 17 |
| [-] | `src/lib/site/types.ts` | — | — |
| [x] | `src/lib/types/auth.ts` | 2 | 2 |
| [-] | `src/lib/users/types.ts` | — | — |
| [x] | `src/lib/utils.ts` | 1 | 1 |
| [-] | `src/lib/validation/analytics.ts` | — | — |
| [x] | `src/lib/validation/announcements.ts` | 2 | 2 |
| [-] | `src/lib/validation/audit-logs.ts` | — | — |
| [x] | `src/lib/validation/auth.ts` | 2 | 2 |
| [-] | `src/lib/validation/backups.ts` | — | — |
| [-] | `src/lib/validation/contact.ts` | — | — |
| [x] | `src/lib/validation/errors.ts` | 6 | 6 |
| [x] | `src/lib/validation/events.ts` | 1 | 1 |
| [x] | `src/lib/validation/inventory.ts` | 1 | 1 |
| [-] | `src/lib/validation/limits.ts` | — | — |
| [x] | `src/lib/validation/menu.ts` | 4 | 4 |
| [-] | `src/lib/validation/notifications.ts` | — | — |
| [-] | `src/lib/validation/publication.ts` | — | — |
| [x] | `src/lib/validation/purchase-orders.ts` | 1 | 1 |
| [x] | `src/lib/validation/reservations.ts` | 1 | 1 |
| [x] | `src/lib/validation/resources.ts` | 1 | 1 |
| [-] | `src/lib/validation/seo.ts` | — | — |
| [x] | `src/lib/validation/site.ts` | 1 | 1 |
| [x] | `src/lib/validation/users.ts` | 2 | 2 |
| [x] | `src/routes/(app)/+layout.server.ts` | 1 | 1 |
| [-] | `src/routes/(app)/+layout.svelte` | — | — |
| [x] | `src/routes/(app)/avisos-importantes/+page.server.ts` | 5 | 5 |
| [x] | `src/routes/(app)/avisos-importantes/+page.svelte` | 6 | 6 |
| [x] | `src/routes/(app)/bitacora/+page.server.ts` | 1 | 1 |
| [-] | `src/routes/(app)/bitacora/+page.svelte` | — | — |
| [x] | `src/routes/(app)/categorias/+page.server.ts` | 4 | 4 |
| [x] | `src/routes/(app)/categorias/+page.svelte` | 6 | 6 |
| [x] | `src/routes/(app)/contacto/+page.server.ts` | 3 | 3 |
| [-] | `src/routes/(app)/contacto/+page.svelte` | — | — |
| [x] | `src/routes/(app)/dashboard/+page.server.ts` | 2 | 2 |
| [x] | `src/routes/(app)/dashboard/+page.svelte` | 1 | 1 |
| [x] | `src/routes/(app)/empleados/+page.server.ts` | 4 | 4 |
| [-] | `src/routes/(app)/empleados/+page.svelte` | — | — |
| [x] | `src/routes/(app)/estadisticas/+page.server.ts` | 6 | 6 |
| [x] | `src/routes/(app)/estadisticas/+page.svelte` | 1 | 1 |
| [x] | `src/routes/(app)/eventos/+page.server.ts` | 7 | 7 |
| [-] | `src/routes/(app)/eventos/+page.svelte` | — | — |
| [x] | `src/routes/(app)/inventario/+page.server.ts` | 8 | 8 |
| [-] | `src/routes/(app)/inventario/+page.svelte` | — | — |
| [x] | `src/routes/(app)/notificaciones/+page.server.ts` | 2 | 2 |
| [-] | `src/routes/(app)/notificaciones/+page.svelte` | — | — |
| [x] | `src/routes/(app)/ordenes-compra/+page.server.ts` | 5 | 5 |
| [-] | `src/routes/(app)/ordenes-compra/+page.svelte` | — | — |
| [-] | `src/routes/(app)/perfil/+page.server.ts` | — | — |
| [x] | `src/routes/(app)/perfil/+page.svelte` | 2 | 2 |
| [x] | `src/routes/(app)/productos/+page.server.ts` | 5 | 5 |
| [-] | `src/routes/(app)/productos/+page.svelte` | — | — |
| [x] | `src/routes/(app)/proveedores/+page.server.ts` | 4 | 4 |
| [-] | `src/routes/(app)/proveedores/+page.svelte` | — | — |
| [x] | `src/routes/(app)/publicacion/+page.server.ts` | 7 | 7 |
| [x] | `src/routes/(app)/publicacion/+page.svelte` | 7 | 7 |
| [x] | `src/routes/(app)/recursos/+page.server.ts` | 4 | 4 |
| [-] | `src/routes/(app)/recursos/+page.svelte` | — | — |
| [-] | `src/routes/(app)/reportes/+page.svelte` | — | — |
| [x] | `src/routes/(app)/reservaciones/+page.server.ts` | 7 | 7 |
| [-] | `src/routes/(app)/reservaciones/+page.svelte` | — | — |
| [x] | `src/routes/(app)/respaldos/+page.server.ts` | 3 | 3 |
| [x] | `src/routes/(app)/respaldos/+page.svelte` | 5 | 5 |
| [x] | `src/routes/(app)/respaldos/descargar/+server.ts` | 1 | 1 |
| [x] | `src/routes/(app)/seo/+page.server.ts` | 4 | 4 |
| [x] | `src/routes/(app)/seo/+page.svelte` | 4 | 4 |
| [x] | `src/routes/(app)/sitio/+page.server.ts` | 4 | 4 |
| [x] | `src/routes/(app)/sitio/+page.svelte` | 5 | 5 |
| [x] | `src/routes/(app)/usuarios/+page.server.ts` | 5 | 5 |
| [-] | `src/routes/(app)/usuarios/+page.svelte` | — | — |
| [-] | `src/routes/+layout.svelte` | — | — |
| [x] | `src/routes/+page.server.ts` | 4 | 4 |
| [x] | `src/routes/+page.svelte` | 3 | 3 |
| [x] | `src/routes/api/notificaciones/+server.ts` | 1 | 1 |
| [x] | `src/routes/api/notificaciones/stream/+server.ts` | 1 | 1 |
| [-] | `src/routes/restablecer/+page.server.ts` | — | — |
| [x] | `src/routes/restablecer/+page.svelte` | 1 | 1 |