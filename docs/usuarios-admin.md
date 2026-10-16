# Usuarios y empleados administrativos

El panel consume el contrato administrativo de `koffisoft_api` mediante un BFF
server-side. Las rutas `/usuarios` y `/empleados` requieren una sesión válida y
el permiso `users.read`; las mutaciones se ejecutan únicamente mediante form
actions y la cookie HttpOnly existente.

## Usuarios

`/usuarios` consulta `GET /users/admin` con `page`, `pageSize`, `search`,
`status` y `role`. La tabla conserva la paginación y los filtros en la URL,
pero la búsqueda se realiza en PostgreSQL antes de paginar.

Las acciones disponibles dependen de los permisos de la sesión:

- `users.manage`: crear, editar, activar, desactivar, bloquear, restablecer
  MFA y forzar cambio de contraseña.
- `roles.manage`: reemplazar las asignaciones de roles de una cuenta.
- `roles.read`: cargar el catálogo de roles activos para los formularios.

La creación usa `POST /users/admin` y permite vincular un empleado, asignar
roles iniciales y marcar `mustChangePassword`. La edición usa
`PATCH /users/admin/:id`; la contraseña no se edita desde este formulario.
Las acciones de estado, MFA y cambio obligatorio usan los endpoints dedicados
documentados por la API y exigen confirmación en el navegador para operaciones
destructivas o sensibles.

## Empleados

`/empleados` consulta `GET /employees/admin` con `page`, `pageSize`, `search`,
`locationId`, `status` y `jobCode`. `DEFAULT_LOCATION_ID` determina la sede
administrativa y también es obligatorio para crear empleados.

El formulario valida los límites del DTO: código de 30 caracteres, nombres de
80, teléfono de 40 y correo de 200. El cargo, estado, fechas y vínculo opcional
con un usuario se envían a `POST /employees/admin` o
`PATCH /employees/admin/:id`. La acción de eliminar llama a
`DELETE /employees/admin/:id`, que desactiva lógicamente el registro.

## Seguridad y errores

`src/lib/server/users.ts` usa el cliente BFF común. Cada llamada conserva las
cookies de la solicitud y reenvía `Origin` y `Referer`, por lo que la API puede
aplicar su guard CSRF. No se almacenan sesiones o tokens en `localStorage` y la
respuesta administrativa no incluye hashes, secretos TOTP ni códigos de
recuperación.

Los permisos también se verifican en cada action del servidor. La interfaz
oculta botones de mutación si la sesión no tiene el permiso correspondiente,
pero la protección efectiva permanece en la API y en el servidor del panel.
Los errores de validación se muestran junto al campo; los errores de contrato,
permisos o conexión se muestran como alertas comprensibles.

## Verificación

Las validaciones nuevas tienen cobertura Vitest en
`src/lib/validation/users.test.ts`. Para revisar el panel completo:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```
