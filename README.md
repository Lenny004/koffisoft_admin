<!-- readme-standard:v1 -->
<!-- Esta línea permite que los agentes de IA reconozcan y actualicen este README. No la borres. -->

<!-- section:header -->

# koffisoft_admin

> Base SvelteKit del panel privado de administración de Koffi-Soft.

[![CI](https://github.com/Lenny004/koffisoft_admin/actions/workflows/ci.yml/badge.svg)](https://github.com/Lenny004/koffisoft_admin/actions/workflows/ci.yml)
[![Licencia MIT](https://img.shields.io/badge/licencia-MIT-yellow.svg)](LICENSE)

<!-- section:toc -->

## 📑 Contenido

- [Aspectos destacados](#-aspectos-destacados)
- [Descripción](#-descripción)
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

- **Base de panel administrativo:** SvelteKit 2, Svelte 5, TypeScript estricto, Tailwind CSS 4 y shadcn-svelte sobre Bits UI.
- **CRUD local verificable:** `/productos` usa TanStack Svelte Table v9 y valida el formulario con Zod sin conectarse todavía a la API ni a la base de datos.
- **Ruta protegida de prueba:** `/prueba-protegida` devuelve 404 por defecto y solo se habilita explícitamente para pruebas locales.
- **CI reproducible:** el workflow de GitHub Actions verifica lint, tipos, pruebas unitarias, build y pruebas E2E en `main` y pull requests.

<!-- section:overview -->

## ℹ️ Descripción

Koffi-Soft es un sistema para un café/restaurante en la Ruta Panorámica de El Salvador. `koffisoft_admin` será su interfaz administrativa para usuarios, roles, catálogo, ingredientes, inventario, proveedores, reservaciones, pedidos, reportes y operaciones administrativas identificadas en el legacy. La Fase 0 valida la arquitectura de UI con una tabla CRUD local y una ruta protegida de prueba, sin autenticación real.

`koffisoft_api` es la API NestJS + Fastify y es dueña de PostgreSQL, Prisma, las sesiones HttpOnly, TOTP, autorización, contratos HTTP y trabajos en segundo plano. `koffisoft_web` es el sitio público SvelteKit y comparte la frontera de contratos; este panel no accede directamente a PostgreSQL ni copia DTOs internos o código PHP.

Cuando se apruebe la fase de contratos, el panel consumirá una versión exacta de `@koffisoft/contracts` publicada por la API; ese paquete todavía no se agrega en Fase 0 y no se inventan endpoints ni DTOs. El legacy es únicamente referencia de migración y no se modifica. La autenticación real se implementará contra sesiones server-side en cookies HttpOnly y TOTP de `koffisoft_api`.

**Stack:** SvelteKit 2.70.3, Svelte 5.57.1, TypeScript 5.9.3, Vite 7.3.6, Tailwind CSS 4.3.3, shadcn-svelte 1.7.0 sobre Bits UI 2.19.5, TanStack Svelte Table 9.2.4, Zod 4.6.5 y `@sveltejs/adapter-node` 5.5.7.

<!-- section:requirements -->

## 📋 Requisitos

- Node.js `24.13.0`, fijado en `package.json` y `.nvmrc`.
- pnpm `11.1.3`, fijado por `packageManager` y `engines` en `package.json`.
- Chromium para ejecutar las pruebas E2E con Playwright.
- SvelteKit `2.70.3`, `@sveltejs/vite-plugin-svelte` `7.3.1`, TypeScript `5.9.3` y Vite `7.3.6`.
- Tailwind CSS `4.3.3` con `@tailwindcss/vite` `4.3.3`.
- shadcn-svelte `1.7.0` sobre Bits UI `2.19.5`; los componentes base incluidos son `Button`, `Input`, `Dialog`, `DropdownMenu` y `Table`.
- ESLint `10.12.0`, `eslint-plugin-svelte` `3.23.0`, TypeScript ESLint `8.71.0`, Prettier `3.9.9` y `prettier-plugin-svelte` `4.1.1`.
- Svelte-check `4.7.6`, Vitest `5.0.3` y Playwright `1.63.0` para verificación y pruebas.

Las versiones directas están fijadas sin rangos en `package.json`; `pnpm-lock.yaml` fija el árbol completo de dependencias.

<!-- section:installation -->

## ⬇️ Instalación

1. Clona el repositorio y entra en su carpeta:

   ```bash
   git clone https://github.com/Lenny004/koffisoft_admin.git
   cd koffisoft_admin
   ```

2. Copia `.env.example` como `.env` y conserva únicamente valores locales de ejemplo.

3. Instala las dependencias:

   ```bash
   pnpm install
   ```

<!-- section:usage -->

## 🚀 Uso

Inicia el servidor de desarrollo:

```bash
pnpm dev
```

Abre la URL que muestre Vite. La pantalla inicial muestra el panel privado en preparación y enlaza a la tabla CRUD de ejemplo en `/productos`. La ruta `/prueba-protegida` responde 404 mientras `ENABLE_PROTECTED_TEST_ROUTE` no sea `true`.

<!-- section:configuration -->

## ⚙️ Configuración

**`.env.example`**

| Variable                      | Descripción                                                                                       | Ejemplo                 | Requerida   |
| ----------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------- | ----------- |
| `PUBLIC_API_BASE_URL`         | URL base de `koffisoft_api`; la Fase 0 todavía no consume endpoints.                              | `http://localhost:3000` | No indicada |
| `ORIGIN`                      | Origen local del panel.                                                                           | `http://localhost:5174` | No indicada |
| `ENABLE_PROTECTED_TEST_ROUTE` | Habilita la ruta protegida de prueba solo cuando vale `true`; no sustituye la autenticación real. | `false`                 | No          |

No guardes tokens o sesiones en `localStorage`; la sesión aprobada será una cookie HttpOnly administrada por la API.

<!-- section:structure -->

## 🗂️ Estructura del proyecto

El árbol muestra como máximo dos niveles. `src/lib/` contiene utilidades y componentes, incluidos `src/lib/components/ui/` y `src/lib/components/admin/`; `src/routes/` contiene las rutas del panel.

```text
.
├── .agents/
│   └── skills/                  # recetas operativas para agentes
├── .github/
│   └── workflows/               # workflow de CI
├── docs/
│   └── reglas-documentacion.md  # reglas de documentación de código
├── src/
│   ├── lib/                     # utilidades y componentes de la interfaz
│   ├── routes/                  # rutas, load functions y form actions
│   ├── app.css                  # tema Tailwind 4 y variables de shadcn-svelte
│   ├── app.d.ts                 # declaraciones de tipos de la aplicación
│   └── app.html                 # plantilla HTML de SvelteKit
├── tests/
│   ├── home.spec.ts             # prueba E2E de la pantalla inicial
│   └── protected-route.spec.ts  # prueba E2E de la ruta protegida
├── .env.example                 # variables de entorno de ejemplo
├── .nvmrc                       # versión de Node.js
├── AGENTS.md                    # reglas para agentes de código
├── LICENSE                      # licencia MIT
├── package.json                 # scripts y dependencias
├── pnpm-lock.yaml               # versiones bloqueadas de dependencias
├── README.md                    # documentación principal
├── playwright.config.ts         # configuración de Playwright
├── svelte.config.js             # configuración de SvelteKit
├── tsconfig.json                # configuración de TypeScript
├── vite.config.ts               # configuración de Vite, Tailwind y SvelteKit
└── vitest.config.ts             # configuración de Vitest
```

<!-- section:development -->

## 🛠️ Desarrollo

Los comandos disponibles para desarrollar, revisar y generar el panel son:

```bash
pnpm dev
pnpm format
pnpm lint
pnpm check
pnpm typecheck
pnpm build
pnpm preview
pnpm start
```

- `pnpm dev` inicia Vite en modo desarrollo.
- `pnpm format` aplica Prettier; `pnpm lint` comprueba ESLint y el formato.
- `pnpm check` sincroniza SvelteKit y ejecuta `svelte-check`; `pnpm typecheck` invoca ese mismo chequeo.
- `pnpm build` genera el build para `adapter-node`.
- `pnpm preview` sirve el build localmente; ejecuta `pnpm start` después de compilar para arrancar `build` con Node.js.

La documentación de código sigue las [reglas de documentación](docs/reglas-documentacion.md).

<!-- section:testing -->

## ✅ Pruebas

Instala Chromium antes de ejecutar las pruebas E2E:

```bash
pnpm exec playwright install chromium
```

Ejecuta las pruebas con estos scripts:

```bash
pnpm test
pnpm test:unit
pnpm test:e2e
pnpm test:e2e:ui
```

- `pnpm test` y `pnpm test:unit` ejecutan Vitest sobre las pruebas `src/**/*.test.ts`; actualmente cubren la utilidad `cn`.
- `pnpm test:e2e` ejecuta las pruebas de Chromium en `tests/`: comprueba el título y encabezado de la pantalla inicial y que la ruta protegida no se publique por defecto.
- `pnpm test:e2e:ui` abre Playwright en modo de interfaz.
- El workflow de [CI](.github/workflows/ci.yml) ejecuta lint, typecheck, pruebas unitarias, build e E2E en cambios de `main` y pull requests hacia `main`.

<!-- section:roadmap -->

## 🗺️ Hoja de ruta y estado

- [x] Fase 0: validar la arquitectura de UI con una tabla CRUD local y una ruta protegida de prueba.
- [ ] Fase de contratos: consumir una versión exacta de `@koffisoft/contracts` publicada por `koffisoft_api`.
- [ ] Autenticación real: integrar las sesiones HttpOnly y TOTP administradas por `koffisoft_api`.

<!-- section:contributing -->

## 💭 Soporte y contribuciones

Reporta errores o solicita ayuda mediante [Issues](https://github.com/Lenny004/koffisoft_admin/issues) y propone cambios mediante [Pull Requests](https://github.com/Lenny004/koffisoft_admin/pulls). Los cambios hacia `main` deben revisarse mediante pull request.

Usa Conventional Commits con gitmoji, por ejemplo `✨ feat(admin): agrega tabla de productos`, `🐛 fix(admin): corrige validación del formulario`, `📝 docs: actualiza la guía`, `🔧 config: ajusta CI` o `✅ tests: cubre ruta protegida`. Prefiere commits grandes y coherentes con una intención revisable.

El dueño crea y publica ramas. Los agentes no crean ramas, no hacen commits y no hacen push sin aprobación explícita de Lenny004.

<!-- section:authors -->

## ✍️ Autores y agradecimientos

- [Lenny004](https://github.com/Lenny004) — LENNYX 004, desarrollador.

<!-- section:license -->

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT. Consulta [LICENSE](LICENSE).
