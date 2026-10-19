# Checklist documentación (funciones y métodos)

Auditoría: `node scripts/audit-docs.mjs` y `node scripts/generate-checklist.mjs`.
Criterio: bloque `/**` en español inmediatamente encima de cada declaración de función.

## Leyenda

| Símbolo | Significado                                            |
| ------- | ------------------------------------------------------ |
| [x]     | Todas las funciones detectadas documentadas            |
| [m]     | Sin funciones; bloque de módulo/componente documentado |
| [~]     | Parcial                                                |
| [ ]     | Pendiente                                              |
| [-]     | Sin funciones y sin documentación de módulo            |

## Resumen

| Métrica      | Cantidad |
| ------------ | -------: |
| files        |      175 |
| completo     |       93 |
| modulo       |       82 |
| parcial      |        0 |
| pendiente    |        0 |
| sinFunciones |        0 |

## Archivos

|     | Archivo                                                 | Funciones | Doc |
| --- | ------------------------------------------------------- | --------: | --: |
| [m] | `src/app.d.ts`                                          |         — |   — |
| [x] | `src/hooks.server.ts`                                   |         1 |   1 |
| [m] | `src/lib/analytics/types.ts`                            |         — |   — |
| [m] | `src/lib/announcements/types.ts`                        |         — |   — |
| [m] | `src/lib/audit/types.ts`                                |         — |   — |
| [m] | `src/lib/backups/types.ts`                              |         — |   — |
| [m] | `src/lib/components/admin/admin-footer.svelte`          |         — |   — |
| [m] | `src/lib/components/admin/admin-shell.svelte`           |         — |   — |
| [x] | `src/lib/components/admin/admin-sidebar.svelte`         |         1 |   1 |
| [x] | `src/lib/components/admin/admin-topbar.svelte`          |         1 |   1 |
| [x] | `src/lib/components/admin/audit-log-browser.svelte`     |         2 |   2 |
| [x] | `src/lib/components/admin/contact-inbox.svelte`         |         8 |   8 |
| [x] | `src/lib/components/admin/employee-directory.svelte`    |         9 |   9 |
| [x] | `src/lib/components/admin/event-module.svelte`          |         9 |   9 |
| [x] | `src/lib/components/admin/inventory-module.svelte`      |        15 |  15 |
| [x] | `src/lib/components/admin/notification-bell.svelte`     |         3 |   3 |
| [x] | `src/lib/components/admin/notification-inbox.svelte`    |         2 |   2 |
| [x] | `src/lib/components/admin/product-crud.svelte`          |         7 |   7 |
| [x] | `src/lib/components/admin/purchase-order-module.svelte` |         9 |   9 |
| [x] | `src/lib/components/admin/reservation-module.svelte`    |         9 |   9 |
| [x] | `src/lib/components/admin/resource-directory.svelte`    |         7 |   7 |
| [x] | `src/lib/components/admin/supplier-directory.svelte`    |         6 |   6 |
| [m] | `src/lib/components/admin/under-construction.svelte`    |         — |   — |
| [x] | `src/lib/components/admin/user-directory.svelte`        |        11 |  11 |
| [m] | `src/lib/components/ui/alert/alert.svelte`              |         — |   — |
| [m] | `src/lib/components/ui/alert/index.ts`                  |         — |   — |
| [m] | `src/lib/components/ui/badge/badge.svelte`              |         — |   — |
| [m] | `src/lib/components/ui/badge/index.ts`                  |         — |   — |
| [m] | `src/lib/components/ui/button/button.svelte`            |         — |   — |
| [m] | `src/lib/components/ui/button/index.ts`                 |         — |   — |
| [m] | `src/lib/components/ui/card/card-content.svelte`        |         — |   — |
| [m] | `src/lib/components/ui/card/card-description.svelte`    |         — |   — |
| [m] | `src/lib/components/ui/card/card-header.svelte`         |         — |   — |
| [m] | `src/lib/components/ui/card/card-title.svelte`          |         — |   — |
| [m] | `src/lib/components/ui/card/card.svelte`                |         — |   — |
| [m] | `src/lib/components/ui/card/index.ts`                   |         — |   — |
| [m] | `src/lib/components/ui/dialog/body.svelte`              |         — |   — |
| [m] | `src/lib/components/ui/dialog/close.svelte`             |         — |   — |
| [m] | `src/lib/components/ui/dialog/content.svelte`           |         — |   — |
| [m] | `src/lib/components/ui/dialog/description.svelte`       |         — |   — |
| [m] | `src/lib/components/ui/dialog/footer.svelte`            |         — |   — |
| [m] | `src/lib/components/ui/dialog/header.svelte`            |         — |   — |
| [m] | `src/lib/components/ui/dialog/index.ts`                 |         — |   — |
| [m] | `src/lib/components/ui/dialog/root.svelte`              |         — |   — |
| [m] | `src/lib/components/ui/dialog/title.svelte`             |         — |   — |
| [m] | `src/lib/components/ui/dialog/trigger.svelte`           |         — |   — |
| [m] | `src/lib/components/ui/dropdown-menu/index.ts`          |         — |   — |
| [x] | `src/lib/components/ui/form-field.svelte`               |         1 |   1 |
| [m] | `src/lib/components/ui/input/index.ts`                  |         — |   — |
| [m] | `src/lib/components/ui/input/input.svelte`              |         — |   — |
| [m] | `src/lib/components/ui/password-input.svelte`           |         — |   — |
| [x] | `src/lib/components/ui/search-select.svelte`            |         1 |   1 |
| [m] | `src/lib/components/ui/table/body.svelte`               |         — |   — |
| [m] | `src/lib/components/ui/table/caption.svelte`            |         — |   — |
| [m] | `src/lib/components/ui/table/cell.svelte`               |         — |   — |
| [m] | `src/lib/components/ui/table/empty.svelte`              |         — |   — |
| [m] | `src/lib/components/ui/table/footer.svelte`             |         — |   — |
| [m] | `src/lib/components/ui/table/head.svelte`               |         — |   — |
| [m] | `src/lib/components/ui/table/header.svelte`             |         — |   — |
| [m] | `src/lib/components/ui/table/index.ts`                  |         — |   — |
| [m] | `src/lib/components/ui/table/pagination.svelte`         |         — |   — |
| [m] | `src/lib/components/ui/table/root.svelte`               |         — |   — |
| [m] | `src/lib/components/ui/table/row.svelte`                |         — |   — |
| [x] | `src/lib/config/navigation.ts`                          |         3 |   3 |
| [x] | `src/lib/contact/types.ts`                              |         1 |   1 |
| [x] | `src/lib/events/types.ts`                               |         3 |   3 |
| [m] | `src/lib/fixtures/dashboard.ts`                         |         — |   — |
| [m] | `src/lib/fixtures/products.ts`                          |         — |   — |
| [x] | `src/lib/formatting/dates.ts`                           |         5 |   5 |
| [m] | `src/lib/inventory/page-types.ts`                       |         — |   — |
| [m] | `src/lib/inventory/types.ts`                            |         — |   — |
| [x] | `src/lib/menu/mappers.ts`                               |         4 |   4 |
| [m] | `src/lib/menu/types.ts`                                 |         — |   — |
| [m] | `src/lib/notifications/types.ts`                        |         — |   — |
| [m] | `src/lib/publication/types.ts`                          |         — |   — |
| [m] | `src/lib/purchase-orders/types.ts`                      |         — |   — |
| [x] | `src/lib/reservations/types.ts`                         |         2 |   2 |
| [m] | `src/lib/resources/types.ts`                            |         — |   — |
| [m] | `src/lib/seo/types.ts`                                  |         — |   — |
| [x] | `src/lib/server/analytics.ts`                           |         8 |   8 |
| [x] | `src/lib/server/announcements.ts`                       |         7 |   7 |
| [x] | `src/lib/server/api.ts`                                 |         9 |   9 |
| [x] | `src/lib/server/audit-logs.ts`                          |         3 |   3 |
| [x] | `src/lib/server/auth-hook.ts`                           |         4 |   4 |
| [x] | `src/lib/server/backups.ts`                             |         6 |   6 |
| [x] | `src/lib/server/contact.ts`                             |         8 |   8 |
| [x] | `src/lib/server/events.ts`                              |        22 |  22 |
| [x] | `src/lib/server/inventory.ts`                           |        23 |  23 |
| [x] | `src/lib/server/menu.ts`                                |        20 |  20 |
| [x] | `src/lib/server/notifications.ts`                       |         6 |   6 |
| [x] | `src/lib/server/publication.ts`                         |         5 |   5 |
| [x] | `src/lib/server/purchase-orders.ts`                     |        15 |  15 |
| [x] | `src/lib/server/query.ts`                               |         1 |   1 |
| [x] | `src/lib/server/reservations.ts`                        |        16 |  16 |
| [x] | `src/lib/server/resources.ts`                           |        10 |  10 |
| [x] | `src/lib/server/return-to.ts`                           |         1 |   1 |
| [x] | `src/lib/server/seo.ts`                                 |         7 |   7 |
| [x] | `src/lib/server/site.ts`                                |         4 |   4 |
| [x] | `src/lib/server/users.ts`                               |        17 |  17 |
| [m] | `src/lib/site/types.ts`                                 |         — |   — |
| [x] | `src/lib/types/auth.ts`                                 |         2 |   2 |
| [m] | `src/lib/users/types.ts`                                |         — |   — |
| [x] | `src/lib/utils.ts`                                      |         1 |   1 |
| [m] | `src/lib/validation/analytics.ts`                       |         — |   — |
| [x] | `src/lib/validation/announcements.ts`                   |         2 |   2 |
| [m] | `src/lib/validation/audit-logs.ts`                      |         — |   — |
| [x] | `src/lib/validation/auth.ts`                            |         2 |   2 |
| [m] | `src/lib/validation/backups.ts`                         |         — |   — |
| [m] | `src/lib/validation/contact.ts`                         |         — |   — |
| [x] | `src/lib/validation/errors.ts`                          |         6 |   6 |
| [x] | `src/lib/validation/events.ts`                          |         1 |   1 |
| [x] | `src/lib/validation/inventory.ts`                       |         1 |   1 |
| [m] | `src/lib/validation/limits.ts`                          |         — |   — |
| [x] | `src/lib/validation/menu.ts`                            |         4 |   4 |
| [m] | `src/lib/validation/notifications.ts`                   |         — |   — |
| [m] | `src/lib/validation/publication.ts`                     |         — |   — |
| [x] | `src/lib/validation/purchase-orders.ts`                 |         1 |   1 |
| [x] | `src/lib/validation/reservations.ts`                    |         1 |   1 |
| [x] | `src/lib/validation/resources.ts`                       |         1 |   1 |
| [m] | `src/lib/validation/seo.ts`                             |         — |   — |
| [x] | `src/lib/validation/site.ts`                            |         1 |   1 |
| [x] | `src/lib/validation/users.ts`                           |         2 |   2 |
| [x] | `src/routes/(app)/+layout.server.ts`                    |         1 |   1 |
| [m] | `src/routes/(app)/+layout.svelte`                       |         — |   — |
| [x] | `src/routes/(app)/avisos-importantes/+page.server.ts`   |         5 |   5 |
| [x] | `src/routes/(app)/avisos-importantes/+page.svelte`      |         6 |   6 |
| [x] | `src/routes/(app)/bitacora/+page.server.ts`             |         1 |   1 |
| [m] | `src/routes/(app)/bitacora/+page.svelte`                |         — |   — |
| [x] | `src/routes/(app)/categorias/+page.server.ts`           |         4 |   4 |
| [x] | `src/routes/(app)/categorias/+page.svelte`              |         6 |   6 |
| [x] | `src/routes/(app)/contacto/+page.server.ts`             |         3 |   3 |
| [m] | `src/routes/(app)/contacto/+page.svelte`                |         — |   — |
| [x] | `src/routes/(app)/dashboard/+page.server.ts`            |         2 |   2 |
| [x] | `src/routes/(app)/dashboard/+page.svelte`               |         1 |   1 |
| [x] | `src/routes/(app)/empleados/+page.server.ts`            |         4 |   4 |
| [m] | `src/routes/(app)/empleados/+page.svelte`               |         — |   — |
| [x] | `src/routes/(app)/estadisticas/+page.server.ts`         |         6 |   6 |
| [x] | `src/routes/(app)/estadisticas/+page.svelte`            |         1 |   1 |
| [x] | `src/routes/(app)/eventos/+page.server.ts`              |         7 |   7 |
| [m] | `src/routes/(app)/eventos/+page.svelte`                 |         — |   — |
| [x] | `src/routes/(app)/inventario/+page.server.ts`           |         8 |   8 |
| [m] | `src/routes/(app)/inventario/+page.svelte`              |         — |   — |
| [x] | `src/routes/(app)/notificaciones/+page.server.ts`       |         2 |   2 |
| [m] | `src/routes/(app)/notificaciones/+page.svelte`          |         — |   — |
| [x] | `src/routes/(app)/ordenes-compra/+page.server.ts`       |         5 |   5 |
| [m] | `src/routes/(app)/ordenes-compra/+page.svelte`          |         — |   — |
| [m] | `src/routes/(app)/perfil/+page.server.ts`               |         — |   — |
| [x] | `src/routes/(app)/perfil/+page.svelte`                  |         2 |   2 |
| [x] | `src/routes/(app)/productos/+page.server.ts`            |         5 |   5 |
| [m] | `src/routes/(app)/productos/+page.svelte`               |         — |   — |
| [x] | `src/routes/(app)/proveedores/+page.server.ts`          |         4 |   4 |
| [m] | `src/routes/(app)/proveedores/+page.svelte`             |         — |   — |
| [x] | `src/routes/(app)/publicacion/+page.server.ts`          |         7 |   7 |
| [x] | `src/routes/(app)/publicacion/+page.svelte`             |         7 |   7 |
| [x] | `src/routes/(app)/recursos/+page.server.ts`             |         4 |   4 |
| [m] | `src/routes/(app)/recursos/+page.svelte`                |         — |   — |
| [m] | `src/routes/(app)/reportes/+page.svelte`                |         — |   — |
| [x] | `src/routes/(app)/reservaciones/+page.server.ts`        |         7 |   7 |
| [m] | `src/routes/(app)/reservaciones/+page.svelte`           |         — |   — |
| [x] | `src/routes/(app)/respaldos/+page.server.ts`            |         3 |   3 |
| [x] | `src/routes/(app)/respaldos/+page.svelte`               |         5 |   5 |
| [x] | `src/routes/(app)/respaldos/descargar/+server.ts`       |         1 |   1 |
| [x] | `src/routes/(app)/seo/+page.server.ts`                  |         4 |   4 |
| [x] | `src/routes/(app)/seo/+page.svelte`                     |         4 |   4 |
| [x] | `src/routes/(app)/sitio/+page.server.ts`                |         4 |   4 |
| [x] | `src/routes/(app)/sitio/+page.svelte`                   |         5 |   5 |
| [x] | `src/routes/(app)/usuarios/+page.server.ts`             |         5 |   5 |
| [m] | `src/routes/(app)/usuarios/+page.svelte`                |         — |   — |
| [m] | `src/routes/+layout.svelte`                             |         — |   — |
| [x] | `src/routes/+page.server.ts`                            |         4 |   4 |
| [x] | `src/routes/+page.svelte`                               |         3 |   3 |
| [x] | `src/routes/api/notificaciones/+server.ts`              |         1 |   1 |
| [x] | `src/routes/api/notificaciones/stream/+server.ts`       |         1 |   1 |
| [m] | `src/routes/restablecer/+page.server.ts`                |         — |   — |
| [x] | `src/routes/restablecer/+page.svelte`                   |         1 |   1 |
