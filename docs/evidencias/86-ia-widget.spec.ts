// @ts-nocheck -- REAL widget/server/fallback. Browser speech instrumented, not physical audio.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
if (process.env.AK_ENTORNO_AISLADO !== 'true' || path.dirname(process.cwd()) !== os.tmpdir()
  || !path.basename(process.cwd()).startsWith('ak-entorno-aislado-')) throw new Error('Solo TEMP aislado');
const id = `e2e_ia86_${process.pid}_${Date.now()}`;
const pregunta = `Resumen de esta fiesta, sonda IA86 ${Date.now()}`;
function leer(file: string) {
  for (const base of ['data', 'src/data']) {
    const p = path.join(process.cwd(), base, file);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return {};
}
test('dictado real del widget envia, respuesta de respaldo se lee y chat persiste; microfono denegado avisa', async ({page, context, baseURL}, info) => {
  test.setTimeout(150000);
  guardarFiesta(crearFiestaDeEstaNoche({id}));
  await ponerSesionDelEquipo(context, baseURL);
  const respuestasVoz: any[] = [];
  page.on('response', async r => {
    if (r.url().endsWith('/api/asistente/voz-parte')) respuestasVoz.push({status:r.status(),body:await r.text().catch(()=>'<sin cuerpo>')});
  });
  await page.addInitScript(() => {
    window.__spoken86 = [];
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    class Rec {
      start() { window.__rec86 = this; }
      stop() { queueMicrotask(() => this.onend?.()); }
    }
    window.SpeechRecognition = Rec;
    Object.defineProperty(window, 'speechSynthesis', {configurable:true, value:{
      getVoices:()=>[{lang:'es-UY', name:'Sonda controlada'}], cancel:()=>{},
      speak:u=>{ window.__spoken86.push(u.text); u.onstart?.(); setTimeout(()=>u.onend?.(),40); },
    }});
  });
  try {
    await page.goto(`/fiestas/nueva/tareas?fiestaId=${id}`, {waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Abrir Asistente IA AK'}).click();
    await expect(page.getByPlaceholder(/Hablar con/)).toBeVisible();
    await page.getByTitle('Dictar por voz (envío automático)',{exact:true}).click();
    await page.evaluate(texto => {
      window.__rec86.onresult({results:[Object.assign([{transcript:texto}],{isFinal:true})]});
      window.__rec86.stop();
    }, pregunta);
    await expect(page.getByText(pregunta,{exact:true})).toBeVisible();
    await expect(page.getByText(/Funcionando en modo respaldo\. Sin datos inventados\./)).toBeVisible({timeout:90000});
    await expect.poll(()=>page.evaluate(()=>window.__spoken86.join('\n')),{timeout:20000, message:JSON.stringify(respuestasVoz)}).toContain('Funcionando en modo respaldo');
    await expect.poll(()=>leer('multiagent/chats.json').sessions?.find(s=>s.fiestaId===id)?.messages?.filter(m=>m.role==='user' && m.content===pregunta).length,{timeout:20000}).toBe(1);
    const stored = leer('multiagent/chats.json').sessions.find(s=>s.fiestaId===id);
    expect(stored.messages.filter(m=>m.role==='assistant')).toHaveLength(1);
    await info.attach('chat-real-persistido.json',{body:JSON.stringify(stored,null,2),contentType:'application/json'});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:'Abrir Asistente IA AK'}).click();
    await expect(page.getByText(pregunta,{exact:true})).toBeVisible();
    await page.getByTitle('Dictar por voz (envío automático)',{exact:true}).click();
    await page.evaluate(()=>window.__rec86.onerror({error:'not-allowed'}));
    await expect(page.getByText(/No se pudo acceder al micrófono/)).toBeVisible();
    expect(leer('multiagent/chats.json').sessions.find(s=>s.fiestaId===id).messages).toHaveLength(2);
    await page.screenshot({path:info.outputPath('asistente-real-86.png')});
  } finally {
    await info.attach('voz-post-respuestas.json',{body:JSON.stringify(respuestasVoz,null,2),contentType:'application/json'});
    borrarFiesta(id);
  }
});
