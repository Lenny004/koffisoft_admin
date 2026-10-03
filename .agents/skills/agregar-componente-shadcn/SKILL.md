---
name: agregar-componente-shadcn
description: Agrega componentes shadcn-svelte 1.7.0 sobre Bits UI y Tailwind CSS 4 al panel administrativo. Usar al necesitar un componente UI base.
---

# Agregar un componente shadcn-svelte

1. Revisar `components.json`, `src/app.css` y `src/lib/utils.ts`; conservar el estilo `new-york` y los alias `$lib/components/ui`.
2. Ejecutar el CLI fijado, por ejemplo `pnpm dlx shadcn-svelte@1.7.0 add dialog`.
3. Revisar los archivos generados bajo `src/lib/components/ui/<componente>/` y conservar sus atributos de accesibilidad.
4. Importar desde el `index.js` generado y tipar props o snippets Svelte 5.
5. No copiar estilos de Bootstrap ni crear estados de negocio dentro del componente UI.
6. Ejecutar `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test` y `pnpm build`.
