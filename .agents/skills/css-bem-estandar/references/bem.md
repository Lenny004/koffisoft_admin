# BEM

## Convención

- Bloque independiente: `.product-card`.
- Elemento propiedad del bloque: `.product-card__title`.
- Modificador de bloque o elemento: `.product-card--featured`,
  `.product-card__title--compact`.
- Estado controlado por JavaScript: `.is-open`, `.has-error`.
- Hook de JavaScript: `.js-open-modal`; nunca se estiliza.

Los modificadores se renderizan con su clase base: `class="product-card
product-card--featured"`. Un bloque no debe depender de un selector padre ni
de su posición en el DOM.

## Buenos ejemplos

```css
.product-card {
  display: grid;
  gap: var(--space-md);
  padding: var(--space-lg);
  color: var(--color-text);
  background: var(--color-surface);
  border: var(--border);
  border-radius: var(--radius-md);
}

.product-card__title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.product-card--featured {
  border-color: var(--color-primary);
}

.product-card__button:hover,
.product-card__button:focus-visible {
  background: var(--color-primary-hover);
}
```

## Malos ejemplos

```css
#products .card .body .title { color: #222 !important; }
.card__body__title { margin-left: 13px; }
.card.button { transition: all 300ms; }
```

El primer selector mezcla ID, descendientes, color hardcodeado e `!important`;
el segundo anida elementos; el tercero encadena clases y usa una transición
costosa. Convierte cada caso a un bloque/elemento BEM con tokens.

La especificidad normal máxima es una clase (`0-1-0`) más una pseudo-clase de
estado. Se permiten mixes para layout, por ejemplo `class="card grid__item"`.
