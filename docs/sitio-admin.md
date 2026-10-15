# Sitio editable en el panel

La ruta protegida `/sitio` administra el contenido público de la sede configurada en `DEFAULT_LOCATION_ID`. El BFF conserva las cookies HttpOnly y solo reenvía las operaciones al endpoint `/site/admin` de `koffisoft_api`.

## Permisos y alcance

- `site_content.read` permite consultar la pantalla.
- `site_content.manage` habilita guardar y agregar/quitar filas.
- La API comprueba el alcance del usuario sobre `locationId`; el panel no acepta una sede distinta de la configurada.

La pantalla oculta acciones de mutación cuando falta `site_content.manage`, muestra la leyenda de campos obligatorios y mantiene los límites en `src/lib/validation/limits.ts`.

## Datos administrados

Se editan dirección, municipio, departamento, teléfono, correo, coordenadas, horarios recurrentes, excepciones, hero, Nosotros, equipo y enlaces sociales. Horarios y excepciones viajan como JSON oculto para que la actualización sea atómica en la API.

## Verificación

La validación Zod cubre URLs HTTP(S), fechas, horas, rangos de coordenadas y máximos compartidos con los DTOs. La prueba `src/lib/validation/site.test.ts` verifica el contrato y rechaza valores inseguros.
