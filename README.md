# koffisoft_admin

Panel privado de administración de Koffi-Soft. Este repositorio será la interfaz para usuarios, roles, catálogo, ingredientes, inventario, proveedores, reservaciones, pedidos, reportes y operaciones administrativas comprobadas en el legacy. La base implementada corresponde a la Fase 0: incluye una ruta protegida de prueba sin autenticación real y una tabla CRUD local para validar la arquitectura de UI.

## Relación con los otros repositorios

- `koffisoft_api` es dueño de PostgreSQL, Prisma, sesiones HttpOnly, TOTP, autorización, contratos HTTP y trabajos en segundo plano.
- `koffisoft_web` es el sitio público y comparte la frontera de contratos, pero no comparte acceso directo a la base de datos.
- En la fase de contratos, el panel consumirá una versión exacta de `@koffisoft/contracts`; en Fase 0 aún no se agrega ese paquete.
- `koffisoft_admin` consumirá contratos publicados por la API y no copiará DTOs internos ni código PHP.
- El legacy en `D:\Lenny\Projects\Koffi-Soft` es solo referencia de migración y no se modifica.

## Stack fijado

- Node.js `24.13.0` y pnpm `11.1.3`.
- SvelteKit `2.70.3`, Svelte `5.57.1`, TypeScript `5.9.3` y Vite `7.3.6`.
- Tailwind CSS `4.3.3` con `@tailwindcss/vite` `4.3.3`.
- shadcn-svelte `1.7.0` sobre Bits UI `2.19.5`, con componentes base compatibles incluidos en el repositorio: `Button`, `Input`, `Dialog`, `DropdownMenu` y `Table`.
- TanStack Svelte Table `9.2.4` para tablas de datos.
- Zod `4.6.5` para validación de formularios.
- Adaptador Node `@sveltejs/adapter-node` `5.5.7`.
- ESLint `10.12.0`, `eslint-plugin-svelte` `3.23.0`, TypeScript ESLint `8.71.0`, Prettier `3.9.9` y `prettier-plugin-svelte` `4.1.1`.
- Vitest `5.0.3` y Playwright `1.63.0`.

Las versiones directas están fijadas sin rangos en `package.json`; `pnpm-lock.yaml` fija el árbol completo.

## Requisitos e instalación

1. Instalar Node.js `24.13.0` y pnpm `11.1.3`.
2. Copiar `.env.example` a `.env` sin agregar secretos.
3. Instalar dependencias:

   ```bash
   pnpm install
   ```

4. Instalar Chromium para la prueba E2E:

   ```bash
   pnpm exec playwright install chromium
   ```

## Variables de entorno

`.env.example` usa valores locales y no contiene secretos:

- `PUBLIC_API_BASE_URL`: URL base de `koffisoft_api`.
- `ORIGIN`: origen local del panel.
- `ENABLE_PROTECTED_TEST_ROUTE`: debe permanecer `false` por defecto; habilita únicamente la ruta de prueba local y no sustituye autenticación.

La autenticación real usará sesiones server-side en cookie HttpOnly y TOTP de la API. No guardar tokens en `localStorage`.

## Scripts

- `pnpm dev`: servidor de desarrollo.
- `pnpm build`: build de producción para `adapter-node`.
- `pnpm preview`: sirve el build localmente.
- `pnpm start`: arranca `build` después de compilar.
- `pnpm lint`: ejecuta ESLint y comprueba el formato de Prettier.
- `pnpm format`: aplica Prettier.
- `pnpm typecheck`: ejecuta `svelte-check` en modo estricto.
- `pnpm test`: ejecuta pruebas unitarias con Vitest.
- `pnpm test:e2e`: verifica la pantalla inicial y que la ruta protegida no se publique por defecto.

## Estructura

```text
src/
  lib/
    components/ui/          # Button, Input, Dialog, DropdownMenu y Table
    components/admin/       # composiciones del panel, incluida la tabla CRUD
    utils.ts                 # utilidades de UI
  routes/                   # rutas, load functions y form actions
  app.css                   # tema Tailwind 4 y variables de shadcn-svelte
tests/                      # pruebas E2E de Playwright
docs/                       # reglas de documentación
.agents/skills/             # recetas para agentes de código
.github/workflows/          # CI
```

La tabla CRUD de `/productos` usa datos locales deliberadamente; no representa todavía endpoints ni modelos de negocio. La ruta `/prueba-protegida` devuelve 404 salvo que `ENABLE_PROTECTED_TEST_ROUTE=true` en un entorno local.

## Commits y ramas

Usar Conventional Commits con gitmoji, por ejemplo `✨ feat(admin): agrega tabla de productos`, `🐛 fix(admin): corrige validación del formulario`, `📝 docs: actualiza la guía`, `🔧 config: ajusta CI` o `✅ tests: cubre ruta protegida`. Mantener cada commit grande y coherente con una intención revisable.

La rama `main` debe recibir cambios revisados mediante pull request. El dueño crea y publica ramas. Los agentes no crean ramas, no hacen commits y no hacen push sin aprobación explícita de Lenny004.
