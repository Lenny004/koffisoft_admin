<!-- readme-standard:v1 -->
<!-- Esta línea permite que los agentes de IA reconozcan y actualicen este README. No la borres. -->

<!-- section:header -->

# koffisoft_admin

> Panel privado de administración de Koffi-Soft para catálogo y operación del café/restaurante.

[![CI](https://github.com/Lenny004/koffisoft_admin/actions/workflows/ci.yml/badge.svg)](https://github.com/Lenny004/koffisoft_admin/actions/workflows/ci.yml)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-yellow.svg)](LICENSE)

<!-- section:toc -->

## 📑 Contenido

- [Aspectos destacados](#-aspectos-destacados)
- [Descripción](#-descripción)
- [Capturas](#-capturas)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Uso](#-uso)
- [Configuración](#-configuración)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Desarrollo](#-desarrollo)
- [Pruebas](#-pruebas)
- [Hoja de ruta y estado](#-hoja-de-ruta-y-estado)
- [Soporte y contribuciones](#-soporte-y-contribuciones)
- [Autores y agradecimientos](#-autores-y-agradecimientos)
- [Licencia](#-licencia)

<!-- section:highlights -->

## 🌟 Aspectos destacados

- **Shell responsive:** sidebar con permisos, offcanvas móvil, topbar, tema oscuro y enlace al sitio público.
- **Autenticación server-side:** sesiones HttpOnly, TOTP, recuperación, cambio obligatorio de contraseña y defensa CSRF por origen.
- **Catálogo conectado:** categorías y productos con form actions, permisos, paginación, búsqueda, validación Zod y cliente server-side para `/menu/admin`.
- **Diseño compartido:** Fraunces + Manrope, Lucide y tokens café/crema/verde de `koffisoft_web`.

- **Reservaciones y eventos conectados:** agenda, estados, mesas, espacios, paquetes, cotizaciones y requisitos con permisos y validación Zod.

<!-- section:overview -->

## ℹ️ Descripción

`koffisoft_admin` es el panel privado de Koffi-Soft. Su shell recupera los módulos operativos del legacy, pero usa SvelteKit 2, Svelte 5, TypeScript estricto, Tailwind CSS 4, shadcn-svelte sobre Bits UI y bloques BEM para la capa visual.

La API (`koffisoft_api`) mantiene PostgreSQL, sesiones, TOTP, permisos y contratos HTTP. El admin no accede directamente a la base de datos. Dashboard y productos usan endpoints documentados cuando hay `DEFAULT_LOCATION_ID`; ventas y otros módulos sin contrato administrativo se identifican como fixtures o “en construcción”.

**Stack:** SvelteKit 2.70.3, Svelte 5.57.1, TypeScript 5.9.3, Vite 7.3.6, Tailwind CSS 4.3.3, shadcn-svelte 1.7.0, TanStack Svelte Table 9.2.4, Zod 4.6.5, Vitest 5.0.3 y Playwright 1.63.0.

<!-- section:visuals -->

## 🖼️ Capturas

![Logo claro de Koffi-Soft usado por el shell](static/brand/logo-light.png)

La taza de acceso y las fotografías de prueba se encuentran en [`static/`](static/).

<!-- section:requirements -->

## 📋 Requisitos

- Node.js `24.13.0`.
- pnpm `11.1.3`.
- Chromium para las pruebas E2E.
- `koffisoft_api` disponible para probar login, sesión y listados reales.

<!-- section:installation -->

## ⬇️ Instalación

```bash
pnpm install
Copy-Item .env.example .env
```

Configura `.env` con los valores locales de la API y del origen del panel. No guardes secretos en el repositorio.

<!-- section:usage -->

## 🚀 Uso

```bash
pnpm dev
```

Abre la URL mostrada por Vite. `/` presenta el login; después de autenticarte, `/dashboard` muestra el shell y los módulos permitidos por la API.

<!-- section:configuration -->

## ⚙️ Configuración

**`.env.example`**

| Variable              | Descripción                                                      | Ejemplo                                | Requerida |
| --------------------- | ---------------------------------------------------------------- | -------------------------------------- | --------- |
| `API_BASE_URL`        | URL privada de `koffisoft_api`.                                  | `http://localhost:3000`                | Sí        |
| `ORIGIN`              | Origen del panel que debe coincidir con `CORS_ORIGIN` de la API. | `http://localhost:5174`                | Sí        |
| `PUBLIC_SITE_URL`     | URL del sitio público enlazado desde el footer.                  | `http://localhost:5173`                | No        |
| `DEFAULT_LOCATION_ID` | UUID de sede para cargar reservas y menú administrativo.         | `00000000-0000-0000-0000-000000000000` | No        |
| `SESSION_COOKIE_NAME` | Nombre base de la cookie de sesión.                              | `session`                              | No        |
| `COOKIE_SECURE`       | Activa cookies Secure detrás de HTTPS.                           | `false`                                | No        |

La sesión nunca se guarda en `localStorage`; la única preferencia local es el tema visual.

<!-- section:structure -->

## 🗂️ Estructura del proyecto

```text
.
├── docs/                         # Diseño, autenticación y catálogo del panel
├── src/lib/components/admin/     # Shell, login, tabla y placeholders
├── src/lib/config/               # Navegación y permisos
├── src/lib/fixtures/              # Datos de prueba claramente marcados
├── src/lib/server/                # BFF de API, auth hook y cliente de menú
├── src/lib/menu/                  # Tipos y mapeos del contrato administrativo
├── src/lib/styles/                # Bloques BEM del shell y pantallas
├── src/routes/(app)/              # Layout y rutas protegidas
├── src/routes/+page.server.ts    # Form actions de login y MFA
├── src/app.css                    # Tokens, tema, reset y fuentes
├── static/                        # Assets de marca y fixtures visuales
├── tests/                         # Pruebas E2E de la pantalla pública
├── .env.example                   # Variables de entorno sin secretos
└── package.json                   # Scripts y dependencias
```

<!-- section:development -->

## 🛠️ Desarrollo

```bash
pnpm dev
pnpm lint
pnpm lint:css
pnpm typecheck
pnpm build
```

La guía visual está en [`docs/sistema-diseno.md`](docs/sistema-diseno.md), el flujo de autenticación en [`docs/auth-admin.md`](docs/auth-admin.md), la integración del catálogo en [`docs/catalogo-admin.md`](docs/catalogo-admin.md) y el módulo operativo en [`docs/reservas-eventos-admin.md`](docs/reservas-eventos-admin.md).

<!-- section:testing -->

## ✅ Pruebas

```bash
pnpm test
pnpm exec playwright install chromium
pnpm test:e2e
```

Vitest cubre validación del login y menú, mapeos del catálogo, cliente server-side, navegación por permisos y hook server-side. Playwright comprueba que la pantalla de login sea pública.

<!-- section:roadmap -->

## 🗺️ Hoja de ruta y estado

- [x] Shell privado, tema, navegación por permisos y login server-side.
- [x] Integración de sesión, TOTP y cambio de contraseña contra los endpoints documentados.
- [x] Dashboard con reservas opcionales y fixtures de ventas marcados.
- [x] CRUD administrativo de categorías y productos contra el contrato de menú.
- [x] Gestión inicial de precios, alérgenos y disponibilidad por variante según permisos.
- [x] Integración administrativa de reservaciones, espacios, mesas y agenda.
- [x] Integración de eventos, bloqueos de espacios, paquetes, cotizaciones y requisitos.
- [ ] Publicar y consumir la versión aprobada de `@koffisoft/contracts`.

<!-- section:contributing -->

## 💡 Soporte y contribuciones

Reporta errores o solicita ayuda mediante [Issues](https://github.com/Lenny004/koffisoft_admin/issues). Los agentes no crean ramas, commits ni push sin aprobación explícita del dueño.

Usa Conventional Commits con gitmoji, por ejemplo `✨ feat(admin): agrega pantalla de reservas` o `🐛 fix(admin): corrige guard de permisos`.

<!-- section:authors -->

## ✍️ Autores y agradecimientos

- [Lenny004](https://github.com/Lenny004) — LENNYX 004, desarrollador.

<!-- section:license -->

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta [LICENSE](LICENSE).
