# Sistema de diseño del panel

Este documento aplica el sistema de diseño compartido con `koffisoft_web`. La fuente de verdad de la marca es [`koffisoft_web/docs/sistema-diseno.md`](../../koffisoft_web/docs/sistema-diseno.md); este archivo documenta únicamente la adaptación del panel privado.

## Dirección visual

El panel conserva la composición del privado legacy —sidebar, topbar, tarjetas y tablas— pero la implementa con Svelte 5, componentes shadcn-svelte y bloques BEM. La paleta usa café y crema como superficies, verde montaña para acciones primarias y un tono burgundy solo para la navegación lateral.

## Tipografía e iconografía

`Fraunces Variable` se usa en encabezados y `Manrope Variable` en controles y texto corrido. Ambas familias llegan desde `@fontsource-variable/*`, con `font-display` gestionado por los paquetes. Las acciones y la navegación usan `@lucide/svelte`; no se agregan iconos PNG del legacy.

La base tipográfica continúa en `16px`. Los tamaños, espacios, radios y capas se expresan en `rem` mediante tokens.

## Tokens

`src/app.css` porta los primitivos y tokens semánticos de la web: `--cream-*`, `--coffee-*`, `--mountain-*`, `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring` y `--radius`.

El panel agrega:

- `--surface-sidebar`, `--surface-sidebar-inner`, `--surface-panel` y `--surface-sunken` para el shell.
- `--table-header` y `--table-header-text` para cabeceras de tabla.
- `--status-success`, `--status-info`, `--status-warning` y `--status-danger` para estados.
- `--sidebar-width`, `--topbar-height`, `--container-max` y la escala de iconos para layout.

El modo oscuro redefine solo tokens semánticos en `[data-theme="dark"]` y `.dark`. El toggle guarda únicamente `koffisoft-theme` en `localStorage`; nunca guarda la sesión, tokens ni datos de autenticación.

## Bloques BEM

Los tokens viven una sola vez en `src/app.css`. Los bloques visuales se separan por responsabilidad en `src/lib/styles/admin-shell.css`, `admin-login.css` y `admin-pages.css`: `admin-shell`, `admin-sidebar`, `admin-topbar`, `admin-footer`, `login-card`, `dashboard`, `products`, `placeholder-page` y `profile-page`.

Los estados usan `is-*` o modificadores BEM (`admin-status--success`). El responsive es mobile-first: el sidebar se convierte en offcanvas y pasa a columna fija desde `64rem`.

## Accesibilidad

Todos los controles interactivos tienen nombre accesible, foco visible y estados de teclado. Las imágenes decorativas usan `alt=""`; logos e ilustraciones informativas tienen texto alternativo. Se respeta `prefers-reduced-motion` y no se depende del color para comunicar el estado.

## Assets

Los assets de prueba se encuentran en `static/brand/` y `static/fixtures/`. Son copias con nombres en inglés del logo, la taza, fotos de productos, categorías y un avatar del legacy. Las fotos no son un contrato de medios de la API; se usan solo para la composición de la Fase 0.
