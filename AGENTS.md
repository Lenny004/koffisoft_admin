# Reglas para agentes de código

Estas reglas aplican a Codex, Cursor, Claude y cualquier otro agente que modifique `koffisoft_admin`.

## Alcance y arquitectura

- Este repositorio es el panel privado de Koffi-Soft y usa SvelteKit 2, Svelte 5, TypeScript estricto, Tailwind CSS 4 y shadcn-svelte sobre Bits UI.
- Las tablas de datos usan TanStack Svelte Table v9 y los formularios deben validar sus entradas con Zod cuando exista un contrato de formulario.
- Las rutas y componentes viven en `src/routes/` y `src/lib/`; los componentes base de shadcn-svelte están en `src/lib/components/ui/`.
- La ruta de prueba protegida no es autenticación real. La autenticación aprobada se implementará contra sesiones HttpOnly y TOTP en `koffisoft_api`.
- Cuando la fase de contratos esté aprobada, el panel consumirá una versión exacta de `@koffisoft/contracts`; Fase 0 no inventa endpoints ni DTOs.
- No inventar endpoints, permisos, modelos o funcionalidades de negocio durante la Fase 0.

## Documentación

Leer [docs/reglas-documentacion.md](docs/reglas-documentacion.md) antes de documentar. Los comentarios son en español y explican propósito, flujo de datos y decisiones no evidentes. Las recetas en `.agents/skills/` son parte de la guía operativa para agentes.

Cuando cambies dependencias, scripts, variables de entorno, estructura de carpetas o funcionalidades, aplica el estándar `readme-standard` (`.agents/skills/readme-standard/SKILL.md`) en modo Actualizar sobre `README.md`. Edita solo las secciones afectadas; no reescribas el archivo.

## Límites y seguridad

- No modificar `D:\Lenny\Projects\Koffi-Soft` ni copiar PHP, contraseñas, hashes, tokens, dumps o credenciales del legacy.
- No guardar secretos en código, pruebas, logs, `README.md`, `.env.example` ni archivos versionados.
- No almacenar tokens o sesiones en `localStorage`; la sesión será una cookie HttpOnly administrada por la API.
- No conectar la UI directamente a PostgreSQL.
- No agregar librerías ni abstraer componentes generados sin necesidad documentada.

## Verificación obligatoria

Antes de terminar cualquier cambio, deben pasar:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Si se modifica una ruta, tabla o formulario, ejecutar también `pnpm test:e2e` después de instalar Chromium.

## Commits y control del repositorio

Usar gitmoji con Conventional Commits: `✨ feat`, `🐛 fix`, `♻️ refactor`, `📝 docs`, `🔧 config`, `✅ tests`, `🔒️ seguridad` y `🗃️ base de datos`. Preferir commits grandes, coherentes y fáciles de revisar.

El agente **NUNCA crea ramas, hace commits ni hace push** sin aprobación explícita del dueño. Debe dejar los cambios sin commitear para revisión.
