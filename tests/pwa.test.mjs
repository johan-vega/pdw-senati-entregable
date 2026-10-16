import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { setup, open, ready, records, capture, snapshot, noOverflow, failWrites, failReads } from './helpers.mjs';
let env;
// Ejecuta las pruebas contra el build de producción para incluir el Service Worker real.
before(async () => { env = await setup(8181); });
after(async () => { await env?.close(); });

// Flujo principal: filtra tareas, valida, persiste, recarga offline, confirma bandeja y caché.
test('TH-01 a TH-07: filtros, validación, bandeja, contador, offline y eliminación confirmada', { timeout: 120000 }, async () => {
  const { context, page } = await open(env);
  try {
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await ready(page, '[data-task-id]'); assert.equal(await page.locator('[data-task-id]').count(), 4);
    await capture(page, '01-tareas');
    await page.getByLabel('Buscar tarea', { exact: true }).fill('MANIFEST'); await page.getByLabel('Curso', { exact: true }).selectOption('Desarrollo de Software PWA'); assert.equal(await page.locator('[data-task-id]').count(), 1); await capture(page, '02-busqueda-filtro');
    await page.getByLabel('Curso', { exact: true }).selectOption('Base de Datos Avanzada'); assert.equal(await page.locator('[data-task-id]').count(), 0); await page.getByRole('button', { name: 'Limpiar filtros' }).click();
    await page.getByRole('button', { name: 'Guardar entrega local', exact: true }).click(); await page.getByText('Selecciona una tarea antes de guardar.', { exact: true }).waitFor(); await page.getByText('Escribe un comentario de entrega; no puede estar vacío.', { exact: true }).waitFor(); assert.equal((await records(page, 'senatiTaskDB', 'entregas_pendientes')).length, 0); await capture(page, '03-validacion');
    await page.getByRole('button', { name: 'Seleccionar Entregable 01: Configuración de Service Worker', exact: true }).click(); await page.getByLabel('Comentario de entrega', { exact: true }).fill('   '); await page.getByRole('button', { name: 'Guardar entrega local', exact: true }).click(); assert.equal((await records(page, 'senatiTaskDB', 'entregas_pendientes')).length, 0);
    await context.setOffline(true); await page.getByRole('status').filter({ hasText: 'Sin conexión' }).waitFor(); await page.getByLabel('Comentario de entrega', { exact: true }).fill('Service Worker configurado. Verifiqué la recarga sin conexión.'); await page.getByRole('button', { name: 'Guardar entrega local', exact: true }).dblclick(); await page.getByTestId('notification').filter({ hasText: 'guardada en este dispositivo' }).waitFor(); assert.equal((await records(page, 'senatiTaskDB', 'entregas_pendientes')).length, 1);
    await page.getByRole('button', { name: 'Seleccionar Laboratorio 03: Script DDL PostgreSQL', exact: true }).click(); await page.getByLabel('Comentario de entrega', { exact: true }).fill('Script de práctica validado con claves y restricciones.'); await page.getByRole('button', { name: 'Guardar entrega local', exact: true }).click(); await page.getByTestId('notification').filter({ hasText: 'Entrega local #2' }).waitFor(); assert.equal(await page.getByTestId('pending-count').textContent(), '2');
    await page.reload(); await page.locator('[data-task-id]').first().waitFor(); await page.getByRole('status').filter({ hasText: 'Sin conexión' }).waitFor(); assert.equal(await page.getByTestId('pending-count').textContent(), '2'); await page.getByRole('button', { name: /Mis entregas locales/ }).click(); assert.equal(await page.locator('[data-delivery-id]').count(), 2); await page.getByText('Ver detalle de la entrega #1', { exact: true }).click(); await page.getByText('Service Worker configurado. Verifiqué la recarga sin conexión.', { exact: true }).waitFor(); await capture(page, '04-bandeja-offline');
    const deliveries = await records(page, 'senatiTaskDB', 'entregas_pendientes'); assert.equal(deliveries[0].tareaId, 101); assert.ok(deliveries[0].fechaRegistro); assert.ok(deliveries.every(e => e.estadoSincronizacion === 'PENDIENTE' && e.intentosSincronizacion === 0));
    await page.getByRole('button', { name: 'Reintentar sincronización', exact: true }).click(); await page.getByTestId('notification').filter({ hasText: 'Sin conexión' }).waitFor();
    await context.setOffline(false); await page.getByText('Conexión recuperada.', { exact: true }).waitFor(); await page.getByRole('button', { name: 'Reintentar sincronización', exact: true }).last().click(); await page.getByTestId('notification').filter({ hasText: 'No hay una API configurada' }).waitFor(); assert.ok((await records(page, 'senatiTaskDB', 'entregas_pendientes')).every(e => e.estadoSincronizacion === 'PENDIENTE' && e.intentosSincronizacion === 0)); await capture(page, '05-conexion-recuperada');
    await page.getByRole('button', { name: 'Eliminar entrega #2', exact: true }).click(); await page.getByRole('dialog').waitFor(); await capture(page, '06-confirmacion-eliminacion'); await page.getByRole('button', { name: 'Cancelar', exact: true }).click(); assert.equal((await records(page, 'senatiTaskDB', 'entregas_pendientes')).length, 2);
    await snapshot(page, 'senatiTaskDB', 'entregas_pendientes', '07-indexeddb-entregas');
    await page.goto(env.url + '/diagnostico.html'); await page.getByRole('heading', { name: 'IndexedDB · senatiTaskDB / entregas_pendientes', exact: true }).waitFor(); await capture(page, '08-diagnostico-real');
    await page.goto(env.url); await page.locator('[data-task-id]').first().waitFor(); await page.getByRole('button', { name: /Mis entregas locales/ }).click(); await page.getByRole('button', { name: 'Eliminar entrega #2', exact: true }).click(); await page.getByRole('button', { name: 'Sí, eliminar', exact: true }).click(); await page.getByTestId('notification').filter({ hasText: 'eliminada de este dispositivo' }).waitFor(); assert.equal(await page.getByTestId('pending-count').textContent(), '1'); await page.reload(); await page.locator('[data-task-id]').first().waitFor(); assert.equal((await records(page, 'senatiTaskDB', 'entregas_pendientes')).length, 1);
    const cached = await page.evaluate(async () => { for (const key of await caches.keys()) { const c = await caches.open(key); if (await c.match('/assets/data/tareas.json')) return true; } return false; }); assert.equal(cached, true);
    await page.setViewportSize({ width: 390, height: 844 }); await noOverflow(page); await capture(page, '09-movil');
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
// Un aborto real de IndexedDB conserva selección/comentario y no incrementa pendientes.
test('TH-08: transacción abortada mantiene formulario y no incrementa contador', { timeout: 60000 }, async () => {
  const context = await env.browser.newContext(); await failWrites(context); const page = await context.newPage();
  try {
    await page.goto(env.url); await page.locator('[data-task-id]').first().waitFor(); await page.getByRole('button', { name: 'Seleccionar Entregable 01: Configuración de Service Worker', exact: true }).click(); await page.getByLabel('Comentario de entrega', { exact: true }).fill('Mi comentario debe conservarse'); await page.getByRole('button', { name: 'Guardar entrega local', exact: true }).click(); await page.getByTestId('notification').filter({ hasText: 'No se pudo guardar la entrega' }).waitFor(); assert.equal(await page.getByLabel('Comentario de entrega', { exact: true }).inputValue(), 'Mi comentario debe conservarse'); assert.equal(await page.locator('#task-select option:checked').textContent(), 'Entregable 01: Configuración de Service Worker'); assert.equal(await page.getByTestId('pending-count').textContent(), '0'); assert.equal((await records(page, 'senatiTaskDB', 'entregas_pendientes')).length, 0); await capture(page, '10-error-persistencia');
  } finally { await context.close(); }
});
// Comprueba que fallos de borrar/leer se informen sin perder ni ocultar registros.
test('Fallo de eliminación conserva registro y contador; fallo de lectura informado', { timeout: 60000 }, async () => {
  const { context, page } = await open(env);
  try {
    await page.locator('[data-task-id]').first().waitFor(); await page.getByRole('button', { name: 'Seleccionar Entregable 01: Configuración de Service Worker', exact: true }).click(); await page.getByLabel('Comentario de entrega', { exact: true }).fill('Registro para probar eliminación fallida'); await page.getByRole('button', { name: 'Guardar entrega local', exact: true }).click(); await page.getByTestId('notification').filter({ hasText: 'guardada en este dispositivo' }).waitFor();
    await page.evaluate(() => { const original = IDBObjectStore.prototype.delete; IDBObjectStore.prototype.delete = function (...args) { const r = original.apply(this, args); r.addEventListener('success', () => this.transaction.abort()); return r; }; });
    await page.getByRole('button', { name: /Mis entregas locales/ }).click(); await page.getByRole('button', { name: 'Eliminar entrega #1', exact: true }).click(); await page.getByRole('button', { name: 'Sí, eliminar', exact: true }).click(); await page.getByTestId('notification').filter({ hasText: 'No se pudo eliminar la entrega' }).waitFor(); assert.equal((await records(page, 'senatiTaskDB', 'entregas_pendientes')).length, 1); assert.equal(await page.getByTestId('pending-count').textContent(), '1');
  } finally { await context.close(); }
  const broken = await env.browser.newContext(); await failReads(broken); const p = await broken.newPage(); try { await p.goto(env.url); await p.getByRole('alert').filter({ hasText: 'No se pudo leer IndexedDB' }).waitFor(); } finally { await broken.close(); }
});
