# Checklist de auditoría

## Contexto y estructura

- [ ] Se detectaron stack, gestor, alcance de estilos y estructura existente.
- [ ] La estructura elegida respeta el proyecto o se justificó si es nuevo.
- [ ] Tokens globales, reset y base tienen un único dueño.
- [ ] Cada bloque tiene un único archivo, módulo o componente dueño.
- [ ] En Svelte los componentes `ui/` generados por shadcn no se reescribieron.

## BEM y cascada

- [ ] Clases en inglés, minúsculas y kebab-case.
- [ ] Elementos usan `__`, modificadores `--`, estados `is-`/`has-`.
- [ ] No hay elementos anidados, IDs, etiquetas de componente ni cadenas largas.
- [ ] No hay `!important`, clases encadenadas ni estilos inline.
- [ ] La especificidad normal no supera una clase más una pseudo-clase de estado.
- [ ] No hay duplicados, código muerto o propiedades que se anulan.

## Tokens y responsive

- [ ] Colores, tamaños, radios, sombras, duraciones y z-index usan tokens.
- [ ] Componentes consumen tokens semánticos, no primitivas.
- [ ] Tema oscuro redefine tokens semánticos, no reglas de componentes.
- [ ] Se respeta la base tipográfica existente; Tailwind usa 16px.
- [ ] Layout mobile-first con unidades relativas y propiedades lógicas.
- [ ] Breakpoints están documentados y son consistentes.

## Base y accesibilidad

- [ ] `box-sizing`, márgenes base, medios responsivos y controles con `font: inherit`.
- [ ] Foco visible con `:focus-visible`; no existe `outline: none` sin reemplazo.
- [ ] Existe reduced-motion y `.sr-only` propio solo si el framework no lo cubre.
- [ ] Contraste mínimo WCAG AA y estados hover/focus/active/disabled.
- [ ] No hay `transition: all`; solo propiedades baratas.
- [ ] `@layer` ordena la cascada cuando está disponible.

## Herramientas

- [ ] `scripts/audit_css.py` termina sin violaciones conocidas.
- [ ] Stylelint usa `stylelint-config-standard` y patrón compatible con BEM.
- [ ] Prettier ignora artefactos de skill si no puede formatearlos correctamente.
- [ ] Se ejecutan build, typecheck y pruebas del proyecto cuando el cambio lo requiere.
