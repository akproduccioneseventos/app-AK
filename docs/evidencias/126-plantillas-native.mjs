import fs from 'node:fs';
import assert from 'node:assert/strict';
import admin from 'firebase-admin';
import {chromium, devices} from '@playwright/test';

const source = 'b520f7cee28546634e1c87391efd7a80e1a40f48';
assert.equal(process.env.COMMIT_SHA, source);
assert.equal(process.env.FIRESTORE_EMULATOR_HOST, '127.0.0.1:8085');
const app = admin.initializeApp({projectId:'demo-ak-producciones'}, 'qa126-probe');
const db = app.firestore(), collection = db.collection('invitacion_digital_templates');
const browser = await chromium.launch({headless:true});
const results = [];
async function snapshot() {
  return (await collection.get()).docs.map(d => ({id:d.id, name:d.data().name, plantilla:d.data().plantilla})).sort((a,b)=>a.id.localeCompare(b.id));
}
async function clear() {
  for (const doc of (await collection.get()).docs) await db.recursiveDelete(doc.ref);
}
try {
  for (const [device, options] of [['desktop',{viewport:{width:1280,height:900}}], ['mobile',devices['Pixel 7']]]) {
    const context = await browser.newContext(options);
    await context.route('**/*', route => {
      const host = new URL(route.request().url()).hostname;
      return host === '127.0.0.1' || host === 'localhost' ? route.continue() : route.abort('blockedbyclient');
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    await page.goto('http://127.0.0.1:3302/entrada');
    for (const lostAck of [false,true]) {
      await clear();
      const exchanges = [];
      let lost = false;
      await page.route('**/settings/templates/invitaciones', async route => {
        const request = route.request();
        if (request.method() !== 'POST' || !request.postData()?.includes('Nueva Plantilla')) return route.continue();
        const response = await route.fetch();
        const stored = await snapshot();
        exchanges.push({status:response.status(), body:request.postData(), stored});
        if (lostAck && !lost) {
          assert.equal(response.status(),200);
          assert.equal(stored.length,1,'Cut must occur AFTER the first actual SDK write');
          lost = true;
          return route.abort('failed');
        }
        return route.fulfill({response});
      });
      await page.goto('http://127.0.0.1:3301/settings/templates/invitaciones');
      const create = page.getByRole('button',{name:'Crear Nueva Plantilla',exact:true});
      await create.waitFor();
      await page.getByText('Grazia Base',{exact:true}).waitFor();
      await create.click();
      if (lostAck) await page.getByText(/No se pudo crear la plantilla:/).waitFor();
      else await page.getByText('Plantilla Creada',{exact:true}).waitFor();
      const afterFirst = await snapshot();
      assert.equal(afterFirst.length,1);
      await create.click();
      await page.waitForFunction(() => {
        const b = [...document.querySelectorAll('button')].find(x=>x.textContent.includes('Crear Nueva Plantilla'));
        return b && !b.disabled;
      });
      const afterRetry = await snapshot();
      const expectedCount = lostAck ? 1 : 2;
      const status = afterRetry.length === expectedCount ? 'PASS' : 'FAIL';
      const screenshot = `docs/evidencias/126-plantillas-${device}-${lostAck?'lost-ack':'deliberate'}.png`;
      await page.screenshot({path:screenshot,fullPage:true});
      await page.reload();
      await page.getByText('Grazia Base',{exact:true}).waitFor();
      const afterReload = await snapshot();
      results.push({device,scenario:lostAck?'RETRY_SAME_ATTEMPT_AFTER_COMMIT_LOST_ACK':'SECOND_DELIBERATE_CREATION',status,
        expectedCount, afterFirst, afterRetry, afterReload, exchanges, samePayload:exchanges.length===2&&exchanges[0].body===exchanges[1].body,
        originalIdRetained:afterRetry.some(x=>x.id===afterFirst[0].id),screenshot,
        realBrowser:true,realAction:true,realDemoFirestore:true,realAccount:false});
      await page.unroute('**/settings/templates/invitaciones');
    }
    await context.close();
  }
} catch (error) {
  results.push({status:'HARNESS_ERROR',message:String(error),stack:error.stack});
  process.exitCode=2;
} finally {
  await browser.close();
  await clear();
  const remaining=(await snapshot()).length;
  await app.delete();
  const record={applicationSourceSha:source,results,remainingTemplates:remaining,allAppCertified:false,
    gate:results.some(x=>x.status==='HARNESS_ERROR')?'QA_INCOMPLETE':results.some(x=>x.status==='FAIL')?'DEFECT_REPRODUCED':'PASS_TESTED_SCENARIOS_ONLY'};
  fs.writeFileSync('docs/evidencias/126-plantillas-native.json',JSON.stringify(record,null,2)+'\n');
  console.log(JSON.stringify({applicationSourceSha:source, gate:record.gate, remainingTemplates:remaining,
    cases:results.map(x=>({device:x.device,scenario:x.scenario,status:x.status,expected:x.expectedCount,observed:x.afterRetry?.length}))}));
  if(record.gate==='DEFECT_REPRODUCED')process.exitCode=1;
}
