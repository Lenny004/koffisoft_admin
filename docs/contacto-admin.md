# Bandeja de contacto en el panel

La ruta protegida `/contacto` consulta la bandeja de mensajes de la sede
configurada en `DEFAULT_LOCATION_ID`. El BFF conserva la sesion HttpOnly y
reenvia las operaciones a `koffisoft_api`.

## Permisos y alcance

- `contact.read` permite ver la bandeja, filtros, detalle y auditoria.
- `contact.manage` habilita cambios de estado, asignacion, archivado y
  conversiones.
- Las acciones se ocultan si falta el permiso y la API comprueba el alcance
  de la sede antes de cada lectura o mutacion.

## Flujo

La tabla pagina mensajes por fecha, filtra por estado, asignacion y texto,
y abre el detalle con cliente, reserva, evento y auditoria. Las conversiones
se solicitan con formularios validados por Zod; si ya existe el vinculo, la
API devuelve el mismo registro sin duplicarlo.

Los formularios muestran placeholders, limites alineados al DTO, la leyenda
`* Campo obligatorio` y solo presentan controles mutables a usuarios con
`contact.manage`.
