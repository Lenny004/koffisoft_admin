# Design tokens

Define tokens globales una sola vez. Usa dos niveles: primitivas sin significado
de interfaz y semánticos que los componentes consumen.

```css
:root {
  --blue-600: oklch(0.55 0.18 250);
  --gray-50: oklch(0.98 0 0);
  --gray-900: oklch(0.2 0 0);

  --color-primary: var(--blue-600);
  --color-bg: var(--gray-50);
  --color-text: var(--gray-900);
  --space-md: 1rem;
  --radius-md: 0.5rem;
  --transition-fast: 150ms ease;
}

[data-theme="dark"] {
  --color-bg: var(--gray-900);
  --color-text: var(--gray-50);
}
```

Si el producto admite un modo automático, añade un bloque
`@media (prefers-color-scheme: dark)` que redefina esos mismos tokens. En una
UI con selector explícito de shadcn-svelte, `.dark`/`[data-theme="dark"]` puede
ser la única activación para no cambiar la apariencia sin decisión del usuario.

## Catálogo mínimo

| Familia | Ejemplos |
| --- | --- |
| Color | `--color-primary`, `--color-surface`, `--color-text-muted`, `--color-border`, `--color-success`, `--color-danger` |
| Tipografía | `--font-family-base`, `--font-size-sm`, `--font-size-lg`, `--font-weight-bold`, `--line-height-base` |
| Espaciado | `--space-xs`, `--space-sm`, `--space-md`, `--space-lg`, `--space-xl` |
| Iconos | `--icon-size-sm`, `--icon-size-md`, `--icon-size-lg` |
| Borde | `--border-width`, `--border`, `--radius-sm`, `--radius-md`, `--radius-full` |
| Sombra | `--shadow-sm`, `--shadow-md`, `--shadow-lg` |
| Movimiento | `--transition-fast`, `--transition-base`, `--ease-standard` |
| Capas | `--z-dropdown`, `--z-sticky`, `--z-modal`, `--z-toast` |
| Layout | `--container-max`, `--header-height`, `--focus-ring` |

En Tailwind 4 los tokens de utilidad se declaran en `@theme` y los valores
semánticos que cambian por tema en `:root`/`.dark`. Conserva los nombres que
requiere shadcn-svelte (`--background`, `--foreground`, `--primary`, `--card`,
`--border`, `--ring`, y sus variantes foreground). No uses `62.5%` en Tailwind;
la base de 16px mantiene correcta la escala `rem`.

Los media queries no aceptan `var()` de forma interoperable: documenta sus
breakpoints y repite los valores en `min-width` mobile-first. Los tokens locales
solo sirven para una variación interna de su propio bloque (`--card-padding`).
