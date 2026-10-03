---
name: crear-ruta-sveltekit
description: Crea una ruta administrativa de SvelteKit 2 con load function, form actions opcionales y componente Svelte 5 tipado. Usar cuando se agregue una pantalla del panel.
---

# Crear una ruta administrativa

1. Confirmar que la pantalla está respaldada por un contrato de `koffisoft_api`; no inventar endpoints ni permisos.
2. Crear la carpeta bajo `src/routes/` con `+page.svelte`; usar `+page.ts` para `load` universal o `+page.server.ts` para datos y acciones solo servidor.
3. Tipar `PageLoad`, `PageServerLoad` y `Actions` desde `./$types`; validar entradas antes de llamar a la API.
4. Usar Svelte 5 (`$props`, `$state`, `$derived`, `$effect`) solo donde aporte reactividad; conservar estados de carga, error y vacío.
5. Consumir contratos HTTP mediante el cliente de la API; nunca acceder directamente a PostgreSQL ni duplicar DTOs internos.
6. Si existe una tabla, componer el componente Data Table de TanStack y las celdas shadcn-svelte; si existe formulario, validar con Zod.
7. Ejecutar `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build`; actualizar una prueba en `tests/` cuando la pantalla tenga interacción.
