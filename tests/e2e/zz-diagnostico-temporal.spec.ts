import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

// TEMPORAL: sirve para ver que muestran el album y la vidriera. Se borra despues.
const ID = 'fiesta-diag-temporal';

test.beforeAll(() => {
  const f = crearFiestaDeEstaNoche({ id: ID });
  f.configuracion.nombreEvento = 'XV de Valentina - Album de Prueba';
  guardarFiesta(f);
});
test.afterAll(() => borrarFiesta(ID));

test('que muestran el album y la portada', async ({ page }, testInfo) => {
  test.setTimeout(240_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'uno alcanza');
  fs.mkdirSync('test-results/diag', { recursive: true });

  for (const [nombre, ruta] of [['album', `/evento/album/${ID}`], ['portada', '/']] as const) {
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
    await page.goto(ruta, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 25_000 }).catch(() => {});
    await page.waitForTimeout(6_000);
    const texto = ((await page.locator('body').innerText().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
    const h1 = await page.locator('h1').count();
    fs.writeFileSync(`test-results/diag/${nombre}.txt`, `H1: ${h1}\n\nTEXTO:\n${texto.slice(0, 900)}\n\nERRORES:\n${errores.slice(0, 3).join('\n')}\n`);
  }
  expect(true).toBe(true);
});
