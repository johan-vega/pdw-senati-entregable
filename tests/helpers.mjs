import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
// Inicia el servidor de producción y Edge/Chromium; close() libera navegador y servidor.
export async function setup(port) {
  const server = spawn(process.execPath, ['scripts/serve.mjs', '--port', String(port)], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = ''; server.stderr.on('data', chunk => { stderr += chunk.toString(); });
  try { await Promise.race([once(server.stdout, 'data'), once(server, 'error').then(([e]) => { throw e; }), once(server, 'exit').then(([code]) => { throw new Error(`El servidor terminó (${code}): ${stderr}`); }), new Promise((_, reject) => setTimeout(() => reject(new Error('Servidor de pruebas sin respuesta.')), 15000).unref())]); }
  catch (error) { server.kill(); throw error; }
  let browser;
  try { browser = await chromium.launch({ headless: true, ...(process.env.PWA_BROWSER ? { channel: process.env.PWA_BROWSER } : process.platform === 'win32' ? { channel: 'msedge' } : {}) }); }
  catch (error) { server.kill(); throw error; }
  await mkdir('evidencias', { recursive: true });
  return { server, browser, url: `http://localhost:${port}`, async close() { await browser.close(); server.kill(); } };
}
// Crea una página aislada para cada prueba, con viewport desktop configurable.
export async function open(env, options = {}) {
  const context = await env.browser.newContext({ viewport: { width: 1440, height: 1000 }, ...options });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.goto(env.url);
  return { context, page };
}
// Espera que el Service Worker se active y controle la página antes de probar offline.
export async function ready(page, selector) {
  await page.locator(selector).first().waitFor();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.locator(selector).first().waitFor();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}
// Lee el almacén solicitado directamente desde IndexedDB para verificar el resultado persistido.
export async function records(page, name, store) {
  return page.evaluate(({ name, store }) => new Promise((resolve, reject) => {
    const req = indexedDB.open(name);
    req.onerror = () => reject(req.error?.message);
    req.onsuccess = () => { const db = req.result; const tx = db.transaction(store, 'readonly'); const r = tx.objectStore(store).getAll(); tx.oncomplete = () => { db.close(); resolve(r.result); }; tx.onerror = () => { db.close(); reject(tx.error?.message); }; };
  }), { name, store });
}
// Guarda capturas de evidencia con la página enfocada arriba y sin controles activos.
export async function capture(page, name) {
  await page.evaluate(async () => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo(0, 0); await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
  await page.screenshot({ path: `evidencias/${name}.png`, fullPage: true });
}
// Exporta los registros del almacén junto con cachés y controlador Service Worker actuales.
export async function snapshot(page, name, store, file) {
  const data = { base: name, almacen: store, registros: await records(page, name, store), cache: await page.evaluate(() => caches.keys()), serviceWorker: await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL) };
  await writeFile(`evidencias/${file}.json`, JSON.stringify(data, null, 2));
}
// Verifica que la página no produzca scroll horizontal en el viewport móvil.
export async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'La vista móvil no debe desbordar horizontalmente');
}
// Aborta la transacción tras el éxito del request para detectar confirmaciones prematuras.
export async function failWrites(context) {
  await context.addInitScript(() => {
    const original = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function (...args) {
      const request = original.apply(this, args);
      request.addEventListener('success', () => this.transaction.abort());
      return request;
    };
  });
}
// Fuerza un error de apertura de IndexedDB para validar el mensaje de recuperación de la UI.
export async function failReads(context) {
  await context.addInitScript(() => { indexedDB.open = () => { throw new DOMException('Prueba de fallo de lectura', 'SecurityError'); }; });
}
