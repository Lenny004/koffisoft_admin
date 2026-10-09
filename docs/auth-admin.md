# Autenticación del panel

El panel usa SvelteKit como BFF server-side frente a `koffisoft_api`. La implementación sigue [`koffisoft_api/docs/auth.md`](../../koffisoft_api/docs/auth.md) y no modifica la API.

## Flujo

1. `/` muestra el login. La form action `login` valida email y contraseña con Zod y llama a `POST /auth/login`.
2. La respuesta se procesa en el servidor. Su `Set-Cookie` se copia a la respuesta de SvelteKit como cookie HttpOnly, `Path=/` y `SameSite=Lax`; el token nunca se serializa al cliente.
3. Si la API devuelve `requiresMfa`, la action `verifyMfa` llama a `POST /auth/mfa/verify`. También se ofrece `POST /auth/mfa/recovery` para un código de recuperación.
4. Si devuelve `requiresMfaSetup`, las actions `setupMfa` y `confirmMfa` usan `POST /auth/mfa/totp/setup` y `POST /auth/mfa/totp/confirm`. Los códigos de recuperación solo se muestran en esa respuesta.
5. Si la respuesta o `/auth/me` indica `mustChangePassword`/`passwordChangeRequired`, se muestra el cambio obligatorio y se llama a `POST /auth/password`.
6. `logout` llama a `POST /auth/logout`, reenvía la limpieza de cookie y elimina la copia local del nombre configurado.

## Hook y permisos

`src/hooks.server.ts` crea el hook con `src/lib/server/auth-hook.ts`. Cuando existe la cookie de sesión, consulta `GET /auth/me` y coloca `user`, `roles`, `permissions` y `mfa` en `event.locals`. Las rutas agrupadas en `(app)` requieren una sesión válida.

La navegación se filtra con `src/lib/config/navigation.ts`. Los permisos usados son los contratos presentes en la semilla de la API: `catalog.read`, `reservations.read`, `events.read`, `inventory.read`, `users.read`, `reports.read` y `auth.password.change`. El hook también devuelve `403` si alguien intenta abrir directamente un módulo sin su permiso.

## CSRF y cookies

Cada llamada server-side a la API reenvía la cookie entrante y establece `Origin` y `Referer` con el origen del panel. Esto satisface la defensa CSRF documentada por la API para mutaciones con cookie. El admin no usa `localStorage` para sesiones ni accede directamente a PostgreSQL.

Variables relevantes:

- `API_BASE_URL`: URL privada de `koffisoft_api`.
- `ORIGIN`: origen esperado del panel; la API debe tenerlo en `CORS_ORIGIN`.
- `SESSION_COOKIE_NAME`: nombre base de la cookie de sesión de la API.
- `COOKIE_SECURE`: usa `true` detrás de HTTPS; en local HTTP puede ser `false`.

`DEFAULT_LOCATION_ID` es opcional y permite que dashboard/productos consulten los listados administrativos ligados a una sede. Sin esa variable se muestran fixtures claramente marcados.
