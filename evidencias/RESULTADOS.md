# Verificación ejecutada - SENATI TaskHub

Fecha: **16/10/2026** (America/Lima). Compilación de producción y pruebas reales en Microsoft Edge 155.0.4283.45, Windows, Node.js 24.15.0 y Playwright 1.56.1.

**Resultado: 3 grupos de pruebas aprobados, 0 fallos.** Producción compilada correctamente, sin advertencias de presupuesto. Iconos PNG comprobados en 192×192 y 512×512; `ngsw.json` generado contiene `performance` y `freshness`.

| Casos | Resultado observado |
| --- | --- |
| TH-01 | MANIFEST + Desarrollo de Software PWA muestra una tarea; otro curso muestra cero; limpiar restaura cuatro. |
| TH-02 | Sin tarea/comentario aparecen errores específicos; solo espacios no guarda. |
| TH-03 / TH-04 | Dos entregas guardadas offline reaparecen al recargar con tarea, comentario, fecha e ID local; estado PENDIENTE. |
| TH-05 | Contador de pendientes = 2 tras guardar; = 1 tras eliminar y recargar. |
| TH-06 | Reintentar offline/online explica el alcance; estados siguen PENDIENTES, intentos remotos = 0. |
| TH-07 | Cancelar conserva dos registros; confirmar elimina solo la entrega seleccionada y persiste al recargar. |
| TH-08 | Aborto de la transacción tras éxito de la solicitud muestra error, conserva selección/comentario, contador = 0 y cero registros creados. |
| Doble clic | Solo se guarda una entrega por operación. |
| Fallo de eliminación | Error visible; registro y contador se conservan. |
| Error de lectura | Se informa el fallo de IndexedDB. |
| PWA offline | Service Worker activo, tareas presentes en Cache Storage, recarga offline funcional. |
| Vista móvil | Revisada en 390×844, sin desbordamiento horizontal. |

## Capturas y datos

- [Tareas con curso, fecha y estado académico](01-tareas.png).
- [Búsqueda y curso combinados](02-busqueda-filtro.png).
- [Validación del formulario](03-validacion.png).
- [Bandeja offline con dos entregas y detalle](04-bandeja-offline.png).
- [Conexión recuperada y reintento sin API](05-conexion-recuperada.png).
- [Confirmación de eliminación](06-confirmacion-eliminacion.png).
- [Registros reales de IndexedDB con fecha y estado](07-indexeddb-entregas.json).
- [Diagnóstico real: manifest, SW, caché e IndexedDB](08-diagnostico-real.png).
- [Vista móvil](09-movil.png).
- [Fallo de escritura con formulario conservado](10-error-persistencia.png).

Capturas tomadas durante el recorrido automático y JSON extraído de IndexedDB. La captura técnica es de `diagnostico.html`, no de DevTools. Se usa un perfil de navegador aislado, sin modificar las entregas del perfil habitual del usuario.

Para reproducir: `npm.cmd test`. Los pasos para capturar los paneles DevTools o ejecutar Lighthouse están en el README. No se probó instalación física en Android/iOS ni una API remota, que queda fuera del proyecto.
