---
name: documentar-codigo
description: Documenta componentes Svelte 5, rutas, Data Tables TanStack y formularios Zod en español siguiendo docs/reglas-documentacion.md. Usar cuando se solicite documentar código de koffisoft_admin sin cambiar comportamiento.
---

# Documentar código del panel

1. Leer `docs/reglas-documentacion.md` y revisar el contexto de cada archivo antes de editar.
2. Identificar componentes `.svelte`, `$props()`, snippets, runes, `load`, form actions, `hooks.server.ts`, tablas TanStack, validaciones Zod y utilidades `.ts` que necesiten contexto.
3. Agregar TSDoc o comentarios de bloque en español para explicar propósito, flujo de datos y decisiones no evidentes.
4. Documentar props, estados, validaciones, acciones, efectos y accesibilidad solo cuando sus restricciones no sean claras.
5. No refactorizar, renombrar, cambiar imports, agregar dependencias ni inventar funcionalidad.
6. Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm test`; ejecutar `pnpm test:e2e` si se afecta una ruta o interacción.
7. Entregar por archivo la ruta, resumen, secciones documentadas, confirmación de que no cambió la lógica y verificaciones.
