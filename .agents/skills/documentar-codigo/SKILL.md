---
name: documentar-codigo
description: Documenta en español cada función y método (TSDoc obligatorio) en componentes Svelte 5, rutas, tablas TanStack y utilidades, siguiendo docs/reglas-documentacion.md. Usar al documentar koffisoft_admin sin cambiar comportamiento.
---

# Documentar código del panel

## Objetivo

Cada **declaración** de función o método en `src/` debe tener un bloque `/** ... */` en **español** inmediatamente encima (sin líneas en blanco entre el cierre `*/` y la declaración). Aplica a:

- `function` / `async function` (incluidas exportadas).
- `const nombre = async (...) =>` y flechas tipadas exportadas.
- Métodos de clase (públicos y privados), salvo constructores vacíos u obvios.
- Handlers de SvelteKit (`export const load`, `export const actions`, `handle` en hooks).
- Funciones dentro del `<script>` de archivos `.svelte`.

No documentar invocaciones (`foo()`), callbacks inline de una sola expresencia obvia, ni archivos que solo exportan tipos/interfaces sin funciones.

## Proceso

1. Leer `docs/reglas-documentacion.md` y el contexto del archivo antes de editar.
2. Ejecutar `node scripts/audit-docs.mjs` para ver pendientes (`scripts/audit-docs-result.json`).
3. Añadir o corregir TSDoc: propósito, flujo de datos y decisiones **no evidentes**; no repetir nombres ni sintaxis obvia.
4. En componentes Svelte 5, añadir bloque de archivo al inicio del `<script>` cuando el componente no sea trivial.
5. **No** refactorizar, renombrar, cambiar imports, firmas, props ni lógica; no inventar rutas, permisos ni validaciones.
6. Verificar: `pnpm lint`, `pnpm typecheck`, `pnpm test`; `pnpm test:e2e` si se tocó una ruta o interacción cubierta.
7. Regenerar checklist: `node scripts/generate-checklist.mjs`.

## Formato TSDoc mínimo

```ts
/**
 * Qué hace y por qué existe en este módulo.
 * Opcional: entradas, salida o efectos laterales solo si no son obvios por los tipos.
 */
export async function obtenerPedido(id: string): Promise<Pedido> { ... }
```

## Entrega

Por archivo: ruta, resumen, símbolos documentados, confirmación de que no cambió la lógica y comandos ejecutados. Si el archivo no tiene funciones declaradas, indicarlo.

## Auditoría

| Comando | Salida |
| --- | --- |
| `node scripts/audit-docs.mjs` | Resumen en consola + `scripts/audit-docs-result.json` |
| `node scripts/generate-checklist.mjs` | `docs/checklist-documentacion.md` |

Estados: `completo` (todas documentadas), `parcial`, `pendiente`, `sin-funciones`.
