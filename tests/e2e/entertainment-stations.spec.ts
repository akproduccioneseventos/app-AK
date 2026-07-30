import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type BrowserContext } from '@playwright/test';
import { initialFiestaActualData } from '../../src/lib/fiesta-defaults';

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';
const FIESTA_ID = 'e2e-entertainment-fiesta';
const fiestaFile = path.join(process.cwd(), 'data', 'fiestas', `${FIESTA_ID}.json`);
let originalFiestaFile: Buffer | null = null;

function createLegacySessionToken() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

async function addAppSession(context: BrowserContext, baseURL: string) {
  await context.addCookies([
    {
      name: 'ak_session',
      value: createLegacySessionToken(),
      url: baseURL,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

test.beforeAll(() => {
  originalFiestaFile = fs.existsSync(fiestaFile) ? fs.readFileSync(fiestaFile) : null;
  const fiesta = structuredClone(initialFiestaActualData);
  fiesta.id = FIESTA_ID;
  fiesta.configuracion = {
    ...fiesta.configuracion,
    clienteNombre: 'Cliente Entretenimiento E2E',
    fechaEvento: '2027-08-21',
    nombreEvento: 'Evento Entretenimiento E2E',
    nombreLugar: 'Salon E2E',
    tipoCelebracion: 'XV Anos',
  };
  fiesta.buzonConfig = {
    enabled: true,
    videoFrameTemplate: 'floral',
    customText: 'Fiesta E2E',
  };

  fs.mkdirSync(path.dirname(fiestaFile), { recursive: true });
  fs.writeFileSync(fiestaFile, JSON.stringify(fiesta, null, 2), 'utf8');
});

test.afterAll(() => {
  if (originalFiestaFile === null) {
    fs.rmSync(fiestaFile, { force: true });
  } else {
    fs.writeFileSync(fiestaFile, originalFiestaFile);
  }
});

test('operator screens load for every camera station', async ({ context, page }, testInfo) => {
  test.setTimeout(300_000);
  test.skip(testInfo.project.name !== 'chromium-desktop', 'The operator matrix only needs one browser project.');
  const baseURL = testInfo.project.use.baseURL as string;
  await addAppSession(context, baseURL);

  const routes = [
    `/evento/fotocabina/${FIESTA_ID}?role=operator`,
    `/evento/plataforma-360/${FIESTA_ID}?role=operator`,
    `/evento/bogue/${FIESTA_ID}?role=operator`,
    `/evento/espejo-magico/${FIESTA_ID}?mode=foto&role=operator`,
    `/evento/espejo-magico/${FIESTA_ID}?mode=firma&role=operator`,
    `/evento/touchpix/${FIESTA_ID}?role=operator`,
  ];

  for (const route of routes) {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), route).toBeLessThan(400);
    await expect(page.locator('body'), route).not.toContainText(/acceso de estacion no autorizado|no se pudo abrir esta estacion/i);
    await expect(page.locator('button:visible').first(), route).toBeVisible();
  }
});

test('photobooth display receives a browser camera stream', async ({ context, page }, testInfo) => {
  const baseURL = testInfo.project.use.baseURL as string;
  await addAppSession(context, baseURL);
  await page.addInitScript(() => {
    const getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const drawing = canvas.getContext('2d');
      drawing?.fillRect(0, 0, canvas.width, canvas.height);
      return canvas.captureStream(30);
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
  });

  const response = await page.goto(`/evento/fotocabina/${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('body')).not.toContainText(/acceso de estacion no autorizado|no se pudo abrir esta estacion/i);
  await expect(page.locator('video').first()).toBeVisible();
});

test('time capsule exposes every media mode and records the configured frame', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'MediaRecorder coverage only needs Chromium desktop.');
  const baseURL = testInfo.project.use.baseURL as string;
  await addAppSession(context, baseURL);
  await page.addInitScript(() => {
    const getUserMedia = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const drawing = canvas.getContext('2d');
      if (drawing) {
        drawing.fillStyle = '#1e3a5f';
        drawing.fillRect(0, 0, canvas.width, canvas.height);
      }
      const stream = canvas.captureStream(20);
      const testWindow = window as typeof window & { __buzonTestStreams?: MediaStream[] };
      testWindow.__buzonTestStreams = [...(testWindow.__buzonTestStreams || []), stream];
      return stream;
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
  });

  const response = await page.goto(`/evento/buzon/${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await expect(page.getByRole('button', { name: /Grabar Video/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Mensaje de Audio/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Subir video/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Subir audio/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Cabina telefónica retro/i })).toBeVisible();

  await page.getByRole('button', { name: /Grabar Video/i }).click();
  const frameCanvas = page.locator('canvas').first();
  await expect(frameCanvas).toBeVisible();
  await expect.poll(async () => frameCanvas.evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const drawing = canvas.getContext('2d');
    if (!drawing || canvas.width !== 640 || canvas.height !== 480) return 0;
    const pixels = drawing.getImageData(0, 0, 40, canvas.height).data;
    let floralPixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      if (green > 170 && green > red * 1.25 && blue > 100) floralPixels += 1;
    }
    return floralPixels;
  })).toBeGreaterThan(20);

  await page.getByRole('button', { name: /Comenzar a Grabar/i }).click();
  const stopButton = page.getByRole('button', { name: /Detener Grabación/i });
  await expect(stopButton).toBeVisible();
  await stopButton.click();
  await expect(page.getByText('Video Analógico')).toBeVisible();
  const reviewVideo = page.locator('video[src^="blob:"]').first();
  await expect(reviewVideo).toBeVisible();
  await expect.poll(async () => reviewVideo.evaluate(async (element) => {
    const source = (element as HTMLVideoElement).src;
    return (await (await fetch(source)).blob()).size;
  })).toBeGreaterThan(0);

  await page.getByRole('button', { name: /Grabar de nuevo/i }).click();
  await expect(page.getByRole('button', { name: /Comenzar a Grabar/i })).toBeVisible();
  await page.getByRole('button', { name: /Volver al menú/i }).click();
  await expect.poll(() => page.evaluate(() => {
    const testWindow = window as typeof window & { __buzonTestStreams?: MediaStream[] };
    return (testWindow.__buzonTestStreams || []).every(
      (mediaStream) => mediaStream.getTracks().every((track) => track.readyState === 'ended'),
    );
  })).toBe(true);
});

test('time capsule bakes the configured frame into an uploaded gallery video', async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'Browser video processing only needs Chromium desktop.');
  const baseURL = testInfo.project.use.baseURL as string;
  await addAppSession(context, baseURL);

  const response = await page.goto(`/evento/buzon/${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBeLessThan(400);
  await page.getByRole('button', { name: /Subir video/i }).click();
  const input = page.locator('input[type="file"][accept="video/*"]');
  await input.evaluate(async (element) => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const drawing = canvas.getContext('2d');
    if (drawing) {
      drawing.fillStyle = '#1e3a5f';
      drawing.fillRect(0, 0, canvas.width, canvas.height);
    }
    const stream = canvas.captureStream(20);
    const candidates = ['video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    const mimeType = candidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || '';
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.start(100);
    let frame = 0;
    const drawingInterval = window.setInterval(() => {
      if (!drawing) return;
      drawing.fillStyle = frame % 2 === 0 ? '#1e3a5f' : '#315b82';
      drawing.fillRect(0, 0, canvas.width, canvas.height);
      drawing.fillStyle = '#ffffff';
      drawing.fillRect((frame * 8) % canvas.width, 80, 40, 40);
      frame += 1;
    }, 50);
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    window.clearInterval(drawingInterval);
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());

    const outputType = recorder.mimeType || mimeType || 'video/webm';
    const extension = outputType.includes('mp4') ? 'mp4' : 'webm';
    const transfer = new DataTransfer();
    transfer.items.add(new File(chunks, `gallery-test.${extension}`, { type: outputType }));
    const fileInput = element as HTMLInputElement;
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await expect(page.getByText('Video Cargado')).toBeVisible();
  const reviewVideo = page.locator('video[src^="blob:"]').first();
  await expect(reviewVideo).toBeVisible();
  await expect.poll(async () => reviewVideo.evaluate(async (element) => {
    const video = element as HTMLVideoElement;
    video.muted = true;
    await video.play();
    await new Promise((resolve) => setTimeout(resolve, 250));
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const drawing = canvas.getContext('2d');
    if (!drawing) return 0;
    drawing.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = drawing.getImageData(0, 0, 40, canvas.height).data;
    let floralPixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      if (green > 170 && green > red * 1.25 && blue > 100) floralPixels += 1;
    }
    return floralPixels;
  })).toBeGreaterThan(20);
});
