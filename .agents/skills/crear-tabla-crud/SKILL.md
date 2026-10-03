---
name: crear-tabla-crud
description: Crea una tabla CRUD administrativa con TanStack Svelte Table v9, componentes shadcn-svelte y formulario validado con Zod. Usar para pantallas de mantenimiento del panel.
---

# Crear una tabla CRUD

1. Confirmar el contrato HTTP, permisos y modelo de datos existentes en `koffisoft_api`; no inferir operaciones que el legacy no pruebe.
2. Definir un tipo de fila local alineado con el contrato y columnas mediante `createColumnHelper`, `tableFeatures` y `createTable` de `@tanstack/svelte-table`.
3. Pasar los datos con un getter (`get data()`) para conservar la reactividad Svelte 5; registrar solo las features TanStack necesarias.
4. Renderizar encabezados y celdas con `FlexRender` y componer `Table`, `Button`, `Input`, `Dialog` y `DropdownMenu` desde shadcn-svelte.
5. Definir un esquema Zod para crear o editar; mostrar mensajes de validación sin ocultar errores del servidor.
6. Mantener estados de carga, vacío, error y confirmación de eliminación explícitos. No usar datos locales como sustituto de la API salvo que la tarea sea un placeholder de Fase 0.
7. Añadir pruebas unitarias para validaciones y una prueba E2E del flujo visible; ejecutar `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` y `pnpm test:e2e`.
