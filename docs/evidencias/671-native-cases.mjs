import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const fixtureId = 'e2e-qa655-buzon';
export const guestStationRoute = id => {
  const payload=Buffer.from(JSON.stringify({version:'ent-v2',fiestaId:id,moduleId:'capsulaTiempo',scope:'guest',expiresAt:Date.now()+3600000,nonce:crypto.randomUUID()})).toString('base64url');
  const signature=crypto.createHmac('sha256','playwright-session-secret-with-enough-entropy').update(payload).digest('base64url');
  return `/evento/buzon/${encodeURIComponent(id)}?access=${payload}.${signature}`;
};
const waitFor = (page, text) => page.getByText(text, { exact: true }).waitFor({ state: 'visible', timeout: 30000 });

async function exportVideo(page, outputDir, name) {
  const video = page.locator('video').last();
  await video.waitFor({ state: 'visible', timeout: 30000 });
  await video.evaluate(el => el.readyState >= 1 ? Promise.resolve() : new Promise((resolve, reject) => {
    el.addEventListener('loadedmetadata', resolve, { once: true });
    el.addEventListener('error', () => reject(new Error('video metadata load failed')), { once: true });
  }));
  const metadata = await video.evaluate(el => ({
    src: el.currentSrc,
    width: el.videoWidth,
    height: el.videoHeight,
    duration: el.duration,
    audioTracks: el.audioTracks?.length ?? null,
  }));
  if (!metadata.src.startsWith('blob:')) throw new Error(`Expected review blob URL, got ${metadata.src}`);
  const bytes = await video.evaluate(async el => Array.from(new Uint8Array(await (await fetch(el.currentSrc)).arrayBuffer())));
  const blobPath = path.join(outputDir, `${name}.webm`);
  await fs.writeFile(blobPath, Buffer.from(bytes));
  const result = { blobPath, bytes: bytes.length, mimeType: await video.evaluate(el => el.src ? el.type || null : null), ...metadata };
  await fs.writeFile(path.join(outputDir, `${name}.metadata.json`), JSON.stringify(result, null, 2));
  if (result.width <= 0 || result.height <= 0 || result.bytes <= 0) throw new Error(`Invalid exported video metadata: ${JSON.stringify(result)}`);
  return result;
}

async function captureCase({ browser, baseURL, outputDir, name, viewport, toneFile, recording, setupContext }) {
  const context = await browser.newContext({ viewport, permissions: recording ? ['camera', 'microphone'] : [] });
  await setupContext(context);
  const page = await context.newPage();
  const result = { name, viewport, pass: false };
  try {
    if (recording) {
      await page.addInitScript(() => {
        const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480;
        const ctx = canvas.getContext('2d');
        const started = performance.now();
        const draw = now => { ctx.fillStyle = `hsl(${(now - started) / 12 % 360} 80% 50%)`; ctx.fillRect(0, 0, 640, 480); ctx.fillStyle = 'white'; ctx.fillRect((now - started) % 600, 40, 100, 80); requestAnimationFrame(draw); };
        requestAnimationFrame(draw);
        const audio = new AudioContext();
        const oscillator = audio.createOscillator(); oscillator.frequency.value = 880;
        const destination = audio.createMediaStreamDestination(); oscillator.connect(destination); oscillator.start();
        const stream = canvas.captureStream(30); destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
        Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async constraints => {
          await audio.resume();
          const tracks = [];
          if (constraints.video) tracks.push(...stream.getVideoTracks());
          if (constraints.audio) tracks.push(...stream.getAudioTracks());
          return new MediaStream(tracks);
        } } });
        window.__qa655Media = { stream, audio, oscillator };
      });
    }
    await page.goto(new URL(guestStationRoute(fixtureId), baseURL).href, { waitUntil: 'domcontentloaded' });
    if (recording) {
      await page.getByRole('button', { name: /Grabar Video/ }).click();
      await page.getByRole('button', { name: 'Comenzar a Grabar' }).click();
      await page.getByRole('button', { name: 'Detener Grabación' }).waitFor({state:'visible',timeout:15000});
      await page.waitForTimeout(2000);
      await page.getByRole('button', { name: 'Detener Grabación' }).click();
      await waitFor(page, 'Video Grabado');
    } else {
      await page.getByRole('button', { name: /Subir Video/i }).click();
      const fileInput = page.locator('input[type="file"][accept="video/*"]');
      await fileInput.setInputFiles(toneFile);
      await waitFor(page, 'Video Cargado');
    }
    result.export = await exportVideo(page, outputDir, name);
    result.pass = true;
  } catch (error) {
    result.error = String(error?.stack || error);
  } finally {
    try { await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: true }); }
    catch (error) { result.screenshotError = String(error); }
    await fs.writeFile(path.join(outputDir, `${name}.result.json`), JSON.stringify(result, null, 2));
    await context.close();
  }
  return result;
}

export async function runCaptureCases({ browser, baseURL, outputDir, toneFile, setupContext }) {
  await fs.mkdir(outputDir, { recursive: true });
  const cases = [
    { name: '671-upload-pc', viewport: { width: 1280, height: 900 }, recording: false },
    { name: '671-record-pixel7', viewport: { width: 390, height: 844 }, recording: true },
    { name: '671-upload-pixel7', viewport: { width: 390, height: 844 }, recording: false },
    { name: '671-record-pc', viewport: { width: 1280, height: 900 }, recording: true },
  ];
  const results=[];
  for(const testCase of cases)results.push(await captureCase({ browser, baseURL, outputDir, toneFile, setupContext, ...testCase }));
  return results;
}
