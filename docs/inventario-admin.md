# Inventario y proveedores en el panel

## Alcance

Las rutas `/inventario` y `/proveedores` consumen únicamente los endpoints
administrativos documentados por `koffisoft_api`. El panel actúa como BFF:
las cargas y form actions ejecutan las llamadas en servidor, reenvían la
cookie HttpOnly y conservan `Origin`/`Referer` para la protección CSRF.

No se conecta PostgreSQL desde SvelteKit y no se guardan tokens en el
navegador. Los decimales se envían como cadenas para conservar la precisión
de `numeric(14,6)`.

## Inventario

`/inventario` ofrece:

- Existencias paginadas por sede, búsqueda, bodega y badge de stock bajo.
- Detalle de un insumo mediante `selected` y su historial filtrable por
  insumo, tipo y rango de fechas.
- Panel de alertas reales de stock bajo y lotes próximos a vencer.
- Listado de recepciones y formulario multilínea para proveedor, bodega,
  lote, fechas, cantidad y costo. `receiptNumber` conserva la idempotencia de
  la API.
- Formulario append-only para ajustes positivos, negativos y mermas con
  motivo obligatorio.
- Listado de recetas versionadas cuando la API devuelve datos.

Las altas, ediciones y desactivaciones de insumos requieren
`inventory.manage`; recepciones requieren `inventory.receive`; ajustes y
mermas requieren `inventory.adjust`; la consulta requiere `inventory.read`.

## Proveedores

`/proveedores` ofrece CRUD paginado y búsqueda server-side. La desactivación
usa el borrado lógico de la API y exige confirmación en el navegador.

Las lecturas requieren `inventory.read` y las mutaciones
`suppliers.manage`. La interfaz oculta botones de mutación si el permiso no
está presente. La API vuelve a comprobar que la sede enviada por el BFF esté
dentro del negocio autorizado por la sesión; el panel no puede cambiar el
`locationId` de una acción para acceder a otra sede.

## Validación y límites

Los formularios usan `src/lib/validation/inventory.ts` y los límites
compartidos de `src/lib/validation/limits.ts`:

- Códigos, nombres, lotes, motivos y notas respetan `maxlength` del DTO y
  schema Prisma.
- Los campos decimales usan hasta seis posiciones y el máximo de
  `numeric(14,6)`.
- Los campos obligatorios usan `FormField`, asterisco, leyenda del formulario,
  placeholder y mensajes de Zod junto al campo.
- Las acciones destructivas muestran confirmación antes de enviar la form
  action.

## Verificación

Pruebas unitarias:

- `src/lib/validation/inventory.test.ts` cubre proveedores, recepciones,
  motivos obligatorios y límites decimales.
- `src/lib/server/inventory.test.ts` cubre query server-side, JSON, cookies,
  origen y traducción de errores HTTP.

Ejecutar la suite del proyecto:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

La implementación no agrega endpoints ni modifica `koffisoft_api`.
