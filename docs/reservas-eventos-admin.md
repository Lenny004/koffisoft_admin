# Reservas y eventos en el panel

El panel consume los endpoints administrativos documentados de `koffisoft_api`
mediante clientes server-side en `src/lib/server/reservations.ts` y
`src/lib/server/events.ts`. Las cookies HttpOnly y las cabeceras CSRF siguen
pasando por `apiRequest`; el navegador nunca recibe la sesión ni accede a
PostgreSQL.

## Reservaciones

`/reservaciones` consulta `GET /reservations/admin` con sede, paginación, rango
de fechas, estado y espacio. La búsqueda por código, cliente o teléfono la
compone el BFF recorriendo las páginas documentadas, porque ese endpoint no
declara un parámetro de texto. La tabla usa TanStack Svelte Table y la agenda
simple reutiliza la misma página de resultados. Las fechas se presentan en
`America/El_Salvador`.

El detalle se abre con el parámetro `selected` y consulta
`GET /reservations/admin/{id}`. Con `reservations.manage` se muestran las
transiciones que permite la API:

- `requested`/`pending_confirmation` a confirmada.
- `confirmed` a sentada, cancelada o no-show.
- `seated` a completada o cancelada.

La asignación o reasignación usa `PUT /reservations/admin/{id}/tables`. La API
valida pertenencia a la sede, capacidad y solapamientos; el mensaje HTTP se
conserva y se muestra en la respuesta de la form action.

El tab de creación interna queda explícitamente deshabilitado porque el
contrato actual no contiene `POST /reservations/admin`. El endpoint público
`POST /reservations` no se reutiliza: crearía una solicitud con origen `web` y
no acepta notas internas ni la semántica de una creación administrativa.

## Espacios y mesas

El tab de mantenimiento usa los endpoints administrativos de reservas:

- `GET/PATCH/POST/DELETE /reservations/admin-spaces` para espacios.
- `GET/PATCH/POST/DELETE /reservations/admin-tables` para mesas.

Los `DELETE` son desactivaciones lógicas en la API. Las form actions validan
campos y capacidades con Zod y solo aparecen y se ejecutan cuando existe
`reservations.manage`.

## Eventos

`/eventos` consulta `GET /events/admin`, sus paquetes y, cuando se selecciona
un evento, su detalle y cotizaciones. `events.read` protege la carga; las
acciones de eventos usan `events.manage`.

La pantalla permite:

- Crear, editar y cancelar eventos mediante `POST/PATCH/DELETE /events/admin`.
- Reservar o liberar espacios. Un solapamiento no se oculta: se presenta el
  mensaje que devuelve la API.
- Crear y editar paquetes con sus líneas mediante los endpoints de paquetes.
- Crear cotizaciones versionadas y cambiar su estado con `event_quotes.manage`.
- Mostrar subtotal, descuento, base imponible, impuesto y total calculados por
  el servidor. El cliente nunca envía totales persistidos.
- Crear, actualizar, resolver y eliminar requisitos operativos.

Las líneas de paquetes y cotizaciones se envían como JSON para conservar la
estructura anidada que exige el DTO. Las fechas de formularios
`datetime-local` se convierten a ISO 8601 con offset `-06:00` antes de llamar a
la API.

## Permisos

| Permiso               | Uso                                                     |
| --------------------- | ------------------------------------------------------- |
| `reservations.read`   | Listados, detalles, espacios y mesas.                   |
| `reservations.manage` | Estados, asignación de mesas y CRUD físico.             |
| `events.read`         | Listados, detalles, paquetes y cotizaciones de lectura. |
| `events.manage`       | Eventos, bloqueos de espacio, paquetes y requisitos.    |
| `event_quotes.manage` | Crear cotizaciones y cambiar sus estados.               |

El servidor comprueba los permisos dentro de cada form action. Ocultar un
botón en Svelte es solo una mejora de interfaz; la protección efectiva está en
`+page.server.ts`.

## Verificación y pruebas

Vitest cubre los clientes BFF, los mapeos de transición, las fechas y los
esquemas Zod de los formularios. Las verificaciones del proyecto son:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Las pruebas pueden requerir ejecución fuera del sandbox si Windows bloquea el
proceso auxiliar de esbuild con `spawn EPERM`.
