---
name: css-bem-estandar
description: >-
  Activa siempre que el usuario pida crear, escribir, mejorar, ordenar, limpiar,
  refactorizar o revisar CSS, estilos, variables CSS, temas, clases,
  componentes visuales, hojas de estilos o BEM. Genera, refactoriza y audita
  CSS con BEM, design tokens, accesibilidad y una estructura adaptada al stack,
  incluso si el usuario no menciona BEM explícitamente.
---

# CSS BEM estándar

Responde en español. Los nombres de clases, custom properties y archivos CSS van
en inglés. Aplica esta skill a cualquier stack; respeta primero la organización
que ya existe y evita reestructuraciones no solicitadas.

## Flujo obligatorio

1. **Detectar el proyecto.** Identifica stack, gestor, presencia de CSS Modules,
   estilos por componente, breakpoints, preprocesadores, Tailwind/shadcn y el
   dueño actual de cada bloque. Audita antes de cambiar. Si el contexto es
   insuficiente para elegir una estructura nueva, pregunta.
2. **Elegir estructura.** Usa la tabla y la guía de
   [structures.md](references/structures.md). En un proyecto existente conserva
   el patrón actual; en uno nuevo explica en una línea la elección.
3. **Definir tokens.** Coloca tokens globales una sola vez. Separa primitivas de
   tokens semánticos y haz que los componentes usen los semánticos. Respeta la
   base tipográfica existente: en proyectos Tailwind es 16px y no se usa
   `html { font-size: 62.5%; }`. Consulta [tokens.md](references/tokens.md).
4. **Escribir bloques BEM.** Cada bloque tiene un único dueño. Usa clases en
   inglés, minúsculas y kebab-case; elementos con `__`, modificadores con `--` y
   estados `is-`/`has-`. Mantén la especificidad en una clase y usa propiedades
   lógicas cuando corresponda. Consulta [bem.md](references/bem.md).
5. **Auditar y verificar.** Ejecuta el auditor, revisa la checklist y el linter
   del proyecto. Reporta violaciones que no se puedan arreglar sin cambiar
   aspecto o comportamiento.

## Árbol de decisión

| Contexto | Estructura recomendada |
| --- | --- |
| HTML/CSS estático pequeño | `styles/` con tokens, reset, base y un archivo por bloque en `components/`. |
| Sistema grande o multi-tema | Capas ITCSS: `tokens/`, `base/`, `layout/`, `components/`, `utilities/`. |
| Next.js/React con CSS Modules | `globals.css` para tokens/reset/base y `Componente.module.css` junto a cada componente. |
| Angular | Global en `src/styles/` y un CSS junto a cada componente; usar `:host`. |
| Vue SFC | `<style scoped>` por componente y estilos globales en `assets/styles/`. |
| CSS por tamaños existente | `base.css` mobile-first y archivos de breakpoint que solo sobrescriban lo mínimo. |
| SvelteKit/Svelte | `<style>` con alcance por componente, donde el componente es el bloque, y tokens globales en `src/app.css`. |
| Tailwind 4 + shadcn-svelte | Tokens en `@theme` y `:root`; CSS propio solo para lo que las utilidades no cubren. No reescribir `src/lib/components/ui/`. |

`@layer` ordena la cascada cuando el entorno lo soporta. El reset/base se carga
una sola vez. No mezcles BEM y utilidades en el mismo elemento sin una razón.

## Reglas que no se negocian

- Formatos válidos: `.block`, `.block__element`, `.block--modifier` y
  `.block__element--modifier`; nunca `.block__body__title`.
- Un bloque es independiente y reutilizable; no depende de su posición.
- No uses IDs, `!important`, estilos inline, selectores de etiqueta dentro de
  componentes, cadenas descendientes largas ni clases encadenadas.
- Los modificadores se usan junto con la base (`class="card card--featured"`).
  Los hooks `js-*` no tienen estilos. Los mixes solo separan layout de bloque.
- Los colores, tamaños, sombras, radios, duraciones y z-index repetibles son
  tokens; no valores mágicos en componentes.
- Incluye reset moderno, foco visible, estados de interacción, reduced-motion,
  unidades relativas, mobile-first y contraste WCAG AA. No uses `transition: all`.
- Ordena propiedades: posicionamiento; display/layout; box model; tipografía;
  visual; animación. Cada archivo debe tener una cabecera breve y comentarios
  que expliquen decisiones, no código comentado.

## Tailwind 4 y shadcn-svelte

Conserva los nombres que shadcn-svelte consume (`--background`, `--foreground`,
`--primary`, `--primary-foreground`, `--card`, `--border`, `--ring`, etc.).
Mapea cualquier token semántico nuevo a esos nombres cuando corresponda. La base
de rem sigue siendo 16px. Los componentes generados de
`src/lib/components/ui/` son dueños de sus clases y no se convierten a BEM.

## Auditoría

El script no necesita dependencias externas:

```bash
python scripts/audit_css.py --mode global src/app.css
python scripts/audit_css.py --mode svelte src
```

`--mode` acepta `global`, `module`, `angular` y `svelte`. El modo `svelte`
extrae solo los bloques `<style>` de archivos `.svelte`. El resultado incluye
archivo, línea, regla y resumen; un código de salida distinto de cero indica
violaciones. La checklist completa está en [checklist.md](references/checklist.md).

## Recursos

- [structures.md](references/structures.md): decisiones y árboles por stack.
- [bem.md](references/bem.md): reglas y ejemplos buenos/malos.
- [tokens.md](references/tokens.md): catálogo y nomenclatura.
- [checklist.md](references/checklist.md): auditoría manual.
- `assets/`: plantillas reutilizables y configuración de Stylelint.
- `scripts/audit_css.py`: auditoría automatizada.
