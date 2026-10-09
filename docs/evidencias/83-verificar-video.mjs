import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

const input = fs.realpathSync(process.argv[2]);
const relative = path.relative(fs.realpathSync(os.tmpdir()), input);
if (!relative.startsWith(`ak-entorno-aislado-`) || relative.startsWith('..')
  || path.basename(input) !== 'buzon-recuerdo-final.webm') throw new Error('Solo el video ficticio de la sonda 83.');
const bytes = fs.readFileSync(input);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent('<video controls muted></video>');
  const decoded = await page.evaluate(async (data) => {
    const video = document.querySelector('video');
    const url = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: 'video/webm' }));
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Video no decodificado en 30 segundos.')), 30_000);
        video.onloadeddata = () => { clearTimeout(timeout); resolve(true); };
        video.onerror = () => { clearTimeout(timeout); reject(new Error('El navegador rechazo el video.')); };
        video.src = url;
        video.load();
      });
      await video.play();
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('No llego cuadro reproducido.')), 10_000);
        video.requestVideoFrameCallback(() => { clearTimeout(timeout); resolve(true); });
      });
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      video.pause();
      return { width: canvas.width, height: canvas.height, readyState: video.readyState,
        firstPixel: [...ctx.getImageData(0, 0, 1, 1).data],
        centerPixel: [...ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data] };
    } finally { URL.revokeObjectURL(url); }
  }, [...bytes]);
  if (!decoded.width || !decoded.height || decoded.readyState < 2
    || !decoded.centerPixel[3]) throw new Error('Sin cuadro decodificado y visible.');
  const result = { sourceBuild: '497ee725cb4d8cce6d1c97422fd674cbbe86c051',
    bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    mime: 'video/webm', decoded, scope: 'Archivo ficticio descargado de emulador; NO hardware ni movimiento real.' };
  fs.writeFileSync(path.resolve('docs/evidencias/83-buzon-video.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result));
} finally { await browser.close(); }
