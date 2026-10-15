# SEO editorial en el panel

La ruta protegida `/seo` lista los metadatos efectivos de paginas, platos,
eventos y avisos publicados. Los defaults provienen de la API y se pueden
guardar como override editorial.

La pantalla usa el BFF server-side para conservar la cookie HttpOnly y envia
`locationId` desde `DEFAULT_LOCATION_ID`. `seo.read` permite consultar; las
acciones de crear, editar y eliminar solo se muestran con `seo.manage`.

Los campos muestran placeholders, limites alineados con Prisma/API, `*` en
los valores requeridos y la leyenda `* Campo obligatorio`. La imagen Open
Graph y la URL canonical se validan como URLs HTTP(S) sin credenciales.

Para levantar el panel:

```bash
pnpm dev
```

Configura `API_BASE_URL`, `DEFAULT_LOCATION_ID` y la sesion local en `.env`.
No agregues secretos al repositorio.
