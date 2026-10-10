// @ts-nocheck -- Fictional SDK fixtures, actual client UI, reserved TEMP only.
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import admin from 'firebase-admin';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
if (process.env.AK_ENTORNO_AISLADO !== 'true'
  || path.dirname(process.cwd()) !== path.join(os.tmpdir(), 'ak-codex88')
  || process.env.FIREBASE_PROJECT_ID !== 'demo-ak-producciones'
  || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Reserved demo runtime only');
const app = admin.initializeApp({ projectId: 'demo-ak-producciones' }, 'portal89-' + process.pid);
const db = app.firestore(); db.settings({ ignoreUndefinedProperties: true });
test.afterAll(async () => { await app.delete(); });

test('el cliente cambia el color, otro navegador lo recibe y otra fiesta conserva el suyo', async ({ page, context, browser }, info) => {
  test.setTimeout(180000);
  const id = 'e2e_portal89_' + Date.now() + '_' + process.pid;
  const fixtures = ['uno', 'otro'].map(suffix => {
    const f = crearFiestaDeEstaNoche({ id: id + '_' + suffix });
    f.clientPortalSettings = { ...f.clientPortalSettings, enabled: true, accessKey: id + '_clave_' + suffix };
    f.clientePortalExperience = { ...f.clientePortalExperience, primaryColor: '#d97706' };
    return f;
  });
  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();
  try {
    for (const f of fixtures) { guardarFiesta(f); await db.collection('fiestas').doc(f.id).set(JSON.parse(JSON.stringify(f))); }
    const url = '/portal/c/' + fixtures[0].clientPortalSettings.accessKey;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Personalizar portada', exact: true })).toBeVisible({ timeout: 60000 });
    await expect.poll(async () => (await context.cookies()).some(c => c.name === 'ak_portal_session'), { timeout: 20000 }).toBe(true);
    expect((await context.cookies()).some(c => c.name === 'ak_session')).toBe(false);
    await page.getByRole('button', { name: 'Personalizar portada', exact: true }).click();
    await page.getByTitle('Esmeralda', { exact: true }).click();
    await expect.poll(async () => (await db.collection('fiestas').doc(fixtures[0].id).get()).data()?.clientePortalExperience?.primaryColor,
      { timeout: 25000 }).toBe('#0d9488');
    await expect(page.getByRole('button', { name: 'Personalizar portada', exact: true })).toBeVisible({ timeout: 20000 });
    await secondPage.goto('http://127.0.0.1:3300' + url, { waitUntil: 'domcontentloaded' });
    await expect.poll(async () => (await secondContext.cookies()).some(c => c.name === 'ak_portal_session'), { timeout: 25000 }).toBe(true);
    await secondPage.getByRole('button', { name: 'Personalizar portada', exact: true }).click({ timeout: 30000 });
    await expect(secondPage.getByTitle('Esmeralda', { exact: true })).toHaveClass(/border-slate-800/);
    const otherColor = (await db.collection('fiestas').doc(fixtures[1].id).get()).data()?.clientePortalExperience?.primaryColor;
    expect(otherColor).toBe('#d97706');
    await info.attach('color-persistido.json', { body: JSON.stringify({ changed: '#0d9488', unchanged: otherColor,
      noTeamSession: true, source: 'actual UI -> SDK -> independent browser' }), contentType: 'application/json' });
    await page.screenshot({ path: info.outputPath('portal-color-origen.png') });
    await secondPage.screenshot({ path: info.outputPath('portal-color.png') });
  } finally {
    await secondContext.close();
    for (const f of fixtures) { await db.collection('fiestas').doc(f.id).delete(); borrarFiesta(f.id); }
  }
});
