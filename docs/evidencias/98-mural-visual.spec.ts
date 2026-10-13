// @ts-nocheck -- visual diagnostics, real isolated demo page only.
import os from 'node:os';
import path from 'node:path';
import admin from 'firebase-admin';
import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.basename(process.cwd()) !== 'ak-entorno-aislado-98' ||
    path.dirname(process.cwd()) !== path.join(os.tmpdir(), 'ak-codex88') || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8085') throw new Error('Demo98 only');
const app = admin.initializeApp({ projectId: 'demo-ak-producciones' }, 'visual98-' + process.pid);
const db = app.firestore(); db.settings({ ignoreUndefinedProperties: true });
test.afterAll(async () => app.delete());

test('Empty mural paints its message after settling, not just DOM presence', async ({ page }, info) => {
  test.setTimeout(150000);
  const id = 'e2e_98_visual_' + process.pid + '_' + Date.now(), fiesta = crearFiestaDeEstaNoche({ id });
  fiesta.socialWallEnabled = true;
  fiesta.socialGallerySettings = { ...fiesta.socialGallerySettings, enabled: true, privateDedicationsMode: false, forcedScreenItem: 'mural' };
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  guardarFiesta(fiesta); await db.collection('fiestas').doc(id).set(JSON.parse(JSON.stringify(fiesta)));
  const measure = () => page.evaluate(() => {
    const section = document.querySelector('[data-testid="live-wall-empty"]');
    const title = section?.querySelector('h1');
    const inspect = e => {
      if (!e) return null; const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      return { tag: e.tagName, className: e.className, text: e.innerText?.slice(0,160), x:r.x,y:r.y,width:r.width,height:r.height,
        display:s.display,position:s.position,flex:s.flex,opacity:s.opacity,overflow:s.overflow,color:s.color,background:s.backgroundColor,transform:s.transform };
    };
    const parents = []; for (let e = title; e; e = e.parentElement) parents.push(inspect(e));
    const r = title?.getBoundingClientRect();
    const top = r ? document.elementFromPoint(Math.max(0,Math.min(innerWidth-1,r.x+r.width/2)),Math.max(0,Math.min(innerHeight-1,r.y+r.height/2))) : null;
    return { viewport:{width:innerWidth,height:innerHeight}, section:inspect(section), title:inspect(title), parents,
      topAtTitle:inspect(top), titleReceivesPoint:!!(title&&top&&(title===top||title.contains(top))), body:document.body.innerText };
  });
  try {
    expect((await page.goto('/evento/muro-en-vivo/' + id, { waitUntil:'domcontentloaded' }))?.status()).toBe(200);
    await expect(page.getByTestId('live-wall-empty')).toBeVisible({ timeout:60000 });
    await page.waitForTimeout(4000);
    const first = await measure(); await info.attach('wall-settled.json',{body:JSON.stringify({...first,errors},null,2),contentType:'application/json'});
    await info.attach('wall-settled.png',{body:await page.screenshot(),contentType:'image/png'});
    await page.waitForTimeout(4000); const later = await measure();
    await info.attach('wall-later.json',{body:JSON.stringify({...later,errors},null,2),contentType:'application/json'});
    await info.attach('wall-later.png',{body:await page.screenshot(),contentType:'image/png'});
    // Causal control ONLY in the QA browser, never acceptance of the original page.
    await page.evaluate(() => document.querySelector('.ak-live-stage').style.setProperty('position','fixed','important'));
    await page.waitForTimeout(400);
    const control = await measure();
    await info.attach('wall-position-control.json',{body:JSON.stringify(control,null,2),contentType:'application/json'});
    await info.attach('wall-position-control.png',{body:await page.screenshot(),contentType:'image/png'});
    expect(control.section.height,'control restoring only fixed position has room').toBeGreaterThan(200);
    expect(control.titleReceivesPoint,'same page, same data; one positioning override').toBe(true);
    expect(later.section.height,'main visible region has space').toBeGreaterThan(200);
    expect(later.titleReceivesPoint,'message is painted in front, not clipped by an ancestor').toBe(true);
  } finally { await db.collection('fiestas').doc(id).delete(); borrarFiesta(id); }
});
