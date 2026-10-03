# Reglas de documentación de código

Estas reglas adaptan el espíritu de `reglas-documentacion-tsx.md` al panel SvelteKit de Koffi-Soft.

## Propósito

Documentar en español componentes `.svelte`, rutas, tablas, formularios y archivos TypeScript sin cambiar la lógica, el comportamiento, la arquitectura ni los contratos. La documentación debe aclarar responsabilidad, flujo de datos y decisiones no evidentes.

## Reglas generales

1. No cambiar lógica de negocio, comportamiento, firmas, imports, props ni estructura para documentar.
2. Conservar documentación correcta y mantener el estilo del archivo.
3. Explicar decisiones y restricciones, no repetir literalmente nombres ni describir sintaxis evidente.
4. No inventar rutas, estados, validaciones, efectos secundarios, endpoints, permisos o funcionalidades.
5. Escribir comentarios breves en español y colocarlos junto al bloque que explican.
6. No modificar el legacy ni copiar sus secretos o datos sensibles.
7. No agregar dependencias o cambiar configuración salvo que la tarea lo solicite.

## Svelte 5 y componentes shadcn-svelte

Documentar componentes no triviales con TSDoc o comentarios de bloque cuando aporte contexto sobre responsabilidad, `$props()`, snippets, accesibilidad, eventos o relación con otros componentes. Explicar `$state`, `$derived` y `$effect` solo cuando el motivo o el ciclo de vida no sea evidente.

Para componentes shadcn-svelte, documentar únicamente personalizaciones de estilo, composición, foco o accesibilidad que no provengan ya de la implementación estándar generada.

## Rutas, tablas y formularios

Documentar `load`, `form actions`, `hooks.server.ts` y archivos `.server.ts` para explicar datos consultados, transformaciones, errores y límites entre navegador y servidor.

En tablas TanStack, documentar por qué se registran features, cómo se actualiza el estado y cómo se mapean columnas o acciones. En formularios Zod, documentar validaciones, valores iniciales, transformaciones, errores y comportamiento tras guardar o cancelar. No inventar validaciones.

## Stores y utilidades `.ts`

Documentar stores, funciones de composición y utilidades que administren estado compartido, coordinen efectos o transformen contratos. La forma de los datos debe quedar expresada primero mediante tipos.

## Proceso y entrega

1. Leer el archivo y su contexto antes de comentar.
2. Conservar comentarios correctos y agregar solo los necesarios.
3. Verificar que no cambió la lógica con `pnpm lint`, `pnpm typecheck` y `pnpm test`.
4. Si se documenta una ruta o interacción, ejecutar también `pnpm test:e2e` cuando aplique.

En la entrega informar por archivo: ruta, resumen, componentes o secciones documentados, confirmación de que no cambió la lógica y verificaciones ejecutadas. Si un archivo no requiere cambios, indicarlo.
