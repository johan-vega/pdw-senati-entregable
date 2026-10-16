# SENATI TaskHub PWA

Caso educativo de App Manifest 002 con las mejoras del proyecto 2 de App Manifest 003. Datos académicos ficticios; no se conecta al Campus Virtual.

## Ejecutar

Requisitos: Node.js con npm (se recomienda Node 22) y un navegador con Service Worker e IndexedDB.

```powershell
cd 'C:\sem complementacion practica\pwa senati'
npm.cmd install
npm.cmd run build
npm.cmd run preview
```

Abre **http://localhost:8081**. Para desarrollo: `npm.cmd start` en http://localhost:4201. El servidor de producción incluido solo escucha en el equipo local.

## Funcionalidades

- Catálogo de tareas JSON con curso, título, instructor, fecha de entrega y estado académico. Conserva las tareas 101 y 102 del documento base y añade ejemplos para probar filtros.
- Búsqueda por título sin distinguir mayúsculas y filtro por curso combinables; botón para limpiar filtros.
- Selección de tarea desde la tarjeta o selector, con resumen de la tarea seleccionada.
- Comentario obligatorio; se rechazan formularios sin tarea o con comentario vacío/solo espacios mediante mensajes específicos.
- Cada entrega se guarda primero en IndexedDB, tanto online como offline, con identificador local, `tareaId`, curso, título, comentario, fecha, estado `PENDIENTE` e intentos remotos `0`.
- Bandeja “Mis entregas locales” recuperada después de recargar, detalles y eliminación tras confirmación explícita. Cancelar o cerrar el diálogo con Escape conserva el registro.
- Contador derivado de las entregas persistidas con estado `PENDIENTE`, actualizado tras guardar o eliminar.
- Indicador de conexión y aviso al recuperar la red, con opción de reintento controlado. Sin API, explica el límite y conserva el estado y el número de intentos remotos.
- Manejo de errores de lectura, guardado y eliminación. Si falla una escritura, se conserva el formulario y el contador no cambia. Se bloquea la operación mientras se escribe para evitar duplicados por doble clic.
- Interfaz adaptable, etiquetas accesibles, confirmación mediante diálogo nativo y opción de instalación cuando el navegador la ofrece.

## Organización

```text
src/app/
  components/            Lista de tareas, formulario, bandeja y estructura visual
  models/models.ts      Interfaces Tarea, EntregaLocal y estados
  services/             HTTP, IndexedDB, conectividad y avisos
  app.component.*       Coordinación del formulario y bandeja
public/
  assets/data/tareas.json Datos originales y tareas adicionales de ejemplo
  data/avisos.json       Ejemplo consumido con estrategia freshness
  icons/                PNG de 192, 512 y maskable 512
  manifest.webmanifest  Identidad e instalación
  diagnostico.html      Inspección técnica de solo lectura
ngsw-config.json        Configuración del Service Worker
scripts/serve.mjs       Servidor local de producción sin dependencias
tests/                  Pruebas funcionales de navegador
evidencias/             Capturas y registros reales de las pruebas
```

Angular core 19.2.25 y CLI/build 19.2.27. `package-lock.json` fija las versiones instaladas. StorageService ofrece `guardarEntregaLocal`, `listarEntregas`, `obtenerEntrega`, `eliminarEntrega` y `contarPendientes`. No se expone una acción de sincronización simulada que cambie estados.

## Seguir los datos

`TareaService` lee `GET /assets/data/tareas.json` desde `public/assets/data/tareas.json`; `NoticeService` lee `/data/avisos.json`. `StorageService` guarda las entregas en IndexedDB (`senatiTaskDB`, almacén `entregas_pendientes`). `AppComponent` coordina carga, selección, validación y pantalla; `TasksComponent` filtra y devuelve el id seleccionado. JSON, manifest y configuración del Service Worker se conservan sin comentarios para mantener su formato válido; el código consumidor indica aquí y junto a la lectura sus fuentes.

## PWA y almacenamiento

- Manifest: `SENATI TaskHub - Gestión de Tareas`, nombre corto `TaskHub`, tema `#0033a0`, fondo blanco, `standalone`, inicio/alcance `./` e iconos PNG.
- Service Worker activo en producción mediante `provideServiceWorker`, precarga del shell e iconos.
- Runtime caching de `/assets/data/tareas.json`: `performance`, máximo 50 respuestas, vigencia 1 día.
- Avisos `/data/avisos.json`: `freshness`, espera de red 3 segundos, caché de hasta 1 hora. Ante fallo sin caché se muestra un aviso predeterminado.
- IndexedDB: base `senatiTaskDB`, almacén `entregas_pendientes`, claves autoincrementales. Confirmación solo después del evento de transacción `oncomplete`.

Visita online, espera la activación del Service Worker y recarga online para cachear tareas bajo su control. Después prueba offline con caché válida. Una primera visita offline o una caché vencida no garantizan la disponibilidad de las tareas.

## Pruebas automáticas y evidencias

```powershell
npm.cmd test
```

Compila producción, inicia servidor temporal en 8181, prueba Microsoft Edge en segundo plano en Windows, genera evidencias y cierra los procesos. Para Chrome: `$env:PWA_BROWSER='chrome'`. En otros sistemas instala Chromium con `npx playwright install chromium`.

Cobertura: TH-01 a TH-08, filtros combinados, selección y comentario obligatorios, espacios en blanco, doble clic, dos entregas offline, recarga, contador, detalle, reintento sin API, cancelar/confirmar eliminación, persistencia de eliminación y errores de lectura/escritura/eliminación. Se abortan transacciones de escritura después del éxito de la solicitud para comprobar que no se confunda `onsuccess` con persistencia confirmada.

Consulta [evidencias/RESULTADOS.md](evidencias/RESULTADOS.md) para los resultados y capturas. Los JSON se extraen de IndexedDB durante la ejecución; el diagnóstico muestra lecturas reales y se identifica expresamente como una página técnica, no como DevTools.

## Prueba manual con DevTools

1. Abre producción online. F12 → Application → Manifest: verifica identidad, iconos y standalone.
2. En Service Workers espera `activated`, recarga online y comprueba la respuesta de tareas en Cache Storage.
3. Busca `MANIFEST`, combina con cada curso y limpia filtros.
4. Guarda el formulario vacío: deben mostrarse errores específicos de tarea y comentario. Prueba un comentario de solo espacios.
5. Activa Network → Offline, selecciona tarea 101 y guarda un comentario; crea otra entrega para tarea 102.
6. Recarga offline. Abre Mis entregas locales y verifica dos registros, detalles y contador 2.
7. En Application → IndexedDB → `senatiTaskDB` → `entregas_pendientes` revisa campos, fecha y `PENDIENTE`.
8. Recupera conexión y usa Reintentar sincronización: se informa que falta API; los registros conservan estado e intentos remotos 0.
9. Elimina una entrega: cancelar conserva; confirmar elimina. Recarga y comprueba contador y persistencia.
10. Opcional: [diagnóstico local](http://localhost:8081/diagnostico.html) muestra datos reales del navegador sin modificarlos.

## Límites y decisiones

No hay API, carga de archivos, autenticación ni sincronización automática. El comentario guardado localmente no acredita recepción por un instructor. `Completado`/`Pendiente` de la tarea es un dato académico del JSON; `PENDIENTE` de la entrega es el estado independiente de sincronización.

La entrega persiste al recargar para que la conectividad no provoque pérdida del trabajo. `tareaId` la relaciona con la tarea; curso y título conservan contexto legible. Una futura API requerirá autenticación, validación de tarea y comentario, autorización, claves de idempotencia para evitar duplicados y respuesta remota confirmada antes de cambiar el estado. El número de intentos solo debe aumentar cuando ocurra una solicitud real.

Manifest define instalación; Service Worker/Cache Storage sirven shell y respuestas GET; IndexedDB conserva entregas. Ninguno de esos mecanismos implementa por sí solo una cola POST con sincronización remota. Los datos se limitan a este origen/perfil y se pierden al borrar los datos del sitio.

Documentación: [configuración del Service Worker de Angular](https://angular.dev/ecosystem/service-workers/config) y [pruebas de una PWA Angular](https://angular.dev/ecosystem/service-workers/getting-started).
