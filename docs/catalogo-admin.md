# Catálogo administrativo

El admin consume el módulo `menu` de `koffisoft_api` mediante un cliente
server-side en `src/lib/server/menu.ts`. Las cookies HttpOnly y las cabeceras
`Origin`/`Referer` pasan por `apiRequest`, por lo que el navegador nunca recibe
la sesión ni accede directamente a la API.

## Configuración

`API_BASE_URL` y `DEFAULT_LOCATION_ID` deben estar configuradas en el entorno del
admin. Si faltan o la API no responde, `/categorias` y `/productos` muestran un
estado de error; no sustituyen los datos reales con fixtures.

## Categorías

La ruta `/categorias` usa `catalog.read` para listar y `catalog.manage` para
crear, editar, activar, desactivar y reordenar. El reordenamiento usa
`POST /menu/admin/categories/reorder` y solo se ofrece porque el contrato
conserva `displayOrder` para categorías.

## Productos y variantes

`/productos` consulta `GET /menu/admin/items` con paginación, búsqueda e
`includeInactive=true`. El filtro por categoría se compone en el BFF porque el
contrato actual no declara `categoryId` como parámetro del listado: cuando se
usa, el servidor recorre las páginas documentadas, filtra por `categoryId` y
pagina el resultado.

Los datos generales de un ítem usan `catalog.manage` y las operaciones de
desactivación llaman al borrado lógico documentado por la API. Precios,
alérgenos y disponibilidad viven en las variantes:

- `menu_prices.manage` permite agregar precios con vigencia mediante el recurso
  de precios de la variante.
- `catalog.manage` reemplaza las declaraciones de alérgenos de una variante.
- `menu_availability.manage` agrega ventanas horarias de una variante.

La API no ofrece todavía un endpoint de tasas de impuesto en este módulo, por
lo que el formulario de precios solicita el UUID de `taxRateId`. Tampoco existe
un campo de imagen en el DTO de ítems; el admin resuelve una imagen provisional
desde `static/fixtures/` por slug o categoría y no envía ese dato a la API.

## Validación y errores

Las form actions validan los formularios con Zod antes de llamar a la API. Las
respuestas no exitosas se muestran como mensajes del servidor y las acciones de
desactivación/eliminación requieren confirmación en la interfaz. Las pruebas de
Vitest cubren el cliente server-side, los mapeos de filas e imágenes y los
esquemas Zod.
