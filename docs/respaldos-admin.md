# Respaldos en el panel

La ruta `/respaldos` consume exclusivamente el BFF server-side de
`koffisoft_api`. La sesión permanece en cookie HttpOnly y el navegador nunca
recibe una ruta física del VPS.

La navegación solo muestra la ruta cuando existe `backups.read`. El botón para
generar requiere `backups.create`, descargar requiere `backups.download` y
eliminar requiere `backups.delete`. Los estados `pending` y `running` no
permiten eliminar, y la eliminación pide confirmación.

El botón **Iniciar respaldo** crea un job de `database`, `uploads` o `full`.
La pantalla muestra el estado, fecha, tamaño, checksum SHA-256 y expiración.
Los fallos del worker se presentan como mensajes seguros devueltos por la API;
no se muestran rutas internas, credenciales ni argumentos de procesos.

La descarga pasa por `/respaldos/descargar?id=...`, valida el UUID, comprueba el
permiso local y reenvía el stream autenticado de la API. La API verifica de
nuevo sesión, permiso, expiración, tamaño y checksum antes de transmitirlo.
