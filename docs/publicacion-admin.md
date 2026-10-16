# Publicacion editorial en el panel

La ruta protegida `/publicacion` centraliza la programacion de avisos,
eventos y platos. El panel consulta los listados administrativos existentes y
usa el BFF server-side para conservar cookies HttpOnly; no accede a Prisma ni
guarda tokens en el navegador.

## Permisos

La navegacion y la ruta requieren `content.publish`. La API ademas comprueba
el permiso de lectura y gestion del recurso elegido y el alcance de la sede.
Si el usuario no tiene el permiso, no se muestra la columna de acciones ni
los botones de publicar y previsualizar.

## Edicion

Cada fila muestra el estado actual y las fechas en `America/El_Salvador`.
“Programar” exige fecha futura; “Publicar ahora” usa la hora de la API; la
expiracion es opcional y debe ser posterior. El formulario conserva
placeholders y la leyenda `* Campo obligatorio`.

“Previsualizar” solicita un enlace opaco de corta duracion. El enlace abre la
ruta publica aislada `/preview/:token`; no se expone el identificador ni el
contenido interno del recurso.

## Verificacion

```bash
pnpm lint
pnpm check
pnpm test
pnpm build
```
