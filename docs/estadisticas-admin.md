# Estadísticas administrativas

La ruta `/estadisticas` consulta los reportes anónimos de `koffisoft_api` y
solo aparece cuando la sesión tiene `analytics.read`. El panel no crea,
edita ni elimina datos: las acciones de escritura permanecen ocultas porque
el módulo es de lectura.

El filtro usa sede, fecha inicial y fecha final. La sede se valida de nuevo en
la API con el alcance del usuario; el rango máximo es de 366 días. Las tarjetas
muestran el total y los días del rango, mientras las gráficas de barras listan
páginas, platos/eventos y dominios de referencia.

Los datos no contienen cookies, IP ni identificadores de visitantes. La API
conserva agregados diarios durante 395 días y presenta `Directo` cuando no hay
dominio de referencia.
