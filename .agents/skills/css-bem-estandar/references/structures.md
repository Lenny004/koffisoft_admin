# Estructuras recomendadas

La regla principal es respetar lo existente. En un proyecto nuevo, elige una
estructura según el stack y el tamaño; no introduzcas ITCSS en un sitio pequeño.
Los tokens globales y el reset tienen un único dueño en todos los casos.

## Estático pequeño

```text
styles/
├── main.css
├── tokens.css
├── reset.css
├── base.css
└── components/
    ├── button.css
    └── card.css
```

`main.css` define el orden e importa los archivos. Usa `@layer` si el navegador
o el build lo soportan.

## ITCSS o design system grande

```text
styles/
├── 00-tokens/
│   ├── primitives.css
│   ├── semantic.css
│   └── themes.css
├── 01-base/
│   ├── reset.css
│   ├── typography.css
│   └── accessibility.css
├── 02-layout/
├── 03-components/
└── 04-utilities/
```

Orden: `tokens`, `reset`, `base`, `layout`, `components`, `utilities`.

## Next.js/React con CSS Modules

```text
app/
├── globals.css
└── components/
    └── Card/
        ├── Card.tsx
        └── Card.module.css
```

El módulo ya limita el alcance. Mantén la convención que el proyecto ya usa;
los modificadores se combinan con `clsx` o equivalente.

## Angular

```text
src/
├── styles/
│   ├── tokens.css
│   ├── reset.css
│   └── utilities.css
├── styles.css
└── app/card/
    ├── card.component.ts
    ├── card.component.html
    └── card.component.css
```

En el componente usa `:host` como raíz y `.card__element` para sus elementos.

## Vue SFC

```text
src/
├── assets/styles/
│   ├── tokens.css
│   └── reset.css
└── components/Card.vue
```

Usa `<style scoped>` para el bloque del componente y deja tokens/reset en el
archivo global.

## CSS por breakpoint

```text
css/
├── base.css
├── tablet.css
└── desktop.css
```

`base.css` es mobile-first. Los otros archivos solo agregan lo que cambia, con
los mismos breakpoints (`768px` y `1024px` en el ejemplo), y no repiten bloques.

## SvelteKit/Svelte

```text
src/
├── app.css
└── lib/components/
    └── Card.svelte
```

`src/app.css` contiene imports de Tailwind, `@theme`, `:root`, temas, reset y
base. Cada componente puede usar un `<style>` con alcance automático de Svelte;
el componente es el bloque y sus clases internas siguen BEM. No se reescriben
los componentes generados bajo `src/lib/components/ui/`.

## Tailwind 4 + shadcn-svelte

```text
src/
├── app.css
└── lib/components/
    ├── ui/                 # generado por shadcn; no convertir a BEM
    └── feature-card.svelte # CSS propio solo si las utilidades no bastan
```

Define tokens primitivos/semánticos en `@theme` y `:root`, conserva los nombres
de shadcn (`--background`, `--foreground`, `--primary`, etc.) y usa utilidades
para lo que ya resuelven. La base tipográfica es 16px: no uses 62.5%.
