// @ts-nocheck -- Evidence copied to tests/e2e in the guarded temporary workspace.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import * as zxing from 'html5-qrcode/third_party/zxing-js.umd';
import { buildAkDemoFiesta } from '../../src/lib/experience-ak/demo-fiesta-factory';
import { leerFiesta, guardarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

const CWD = process.cwd();
const REQUIRED_TEMP_CWD = path.join(os.tmpdir(), 'ak-entorno-aislado-SkNAHJ');
if (
  process.env.AK_ENTORNO_AISLADO !== 'true' ||
  path.basename(CWD) !== 'ak-entorno-aislado-SkNAHJ' ||
  path.resolve(CWD) !== path.resolve(REQUIRED_TEMP_CWD)
) {
  throw new Error('Sonda A85 bloqueada: requiere cwd TEMP\\ak-entorno-aislado-SkNAHJ y AK_ENTORNO_AISLADO=true.');
}

const PREFIX = `e2e_a85_${process.pid}_${Date.now()}`;
const GUEST_NAME = 'Sofia Invitada de Prueba A85';
const COMPANION_NAMES = ['Acompanante Uno A85', 'Acompanante Dos A85'];
const PORTAL_ACCESS_KEY = 'clave-de-prueba-e2e-a85';
const DATA_DIRS = [
  path.join(CWD, 'data', 'fiestas'),
  path.join(CWD, 'src', 'data', 'fiestas'),
];
const fiestaBase = buildAkDemoFiesta('xv');
const fiesta = {
  ...fiestaBase,
  id: PREFIX,
  invitados: [
    { id: `${PREFIX}_guest`, nombre: GUEST_NAME, rsvp: 'Pendiente', categoria: 'Adulto',
      partySize: 1, tableNumber: '7', guestAccessToken: `${PREFIX}_token` },
    { id: `${PREFIX}_other`, nombre: 'Otro Invitado A85', rsvp: 'Confirmado', categoria: 'Adulto',
      partySize: 1, tableNumber: '8', guestAccessToken: `${PREFIX}_other_token` },
  ],
  modulosContratados: { ...fiestaBase.modulosContratados, numerosMesa: true, checkin: true },
  configuracion: {
    ...fiestaBase.configuracion,
    nombreEvento: 'Fiesta de prueba A85',
    nombreLugar: 'Salon E2E A85',
    direccionLugar: 'Direccion ficticia A85',
    fechaEvento: '2099-12-31',
  },
  clientPortalSettings: {
    ...fiestaBase.clientPortalSettings,
    enabled: true,
    accessKey: PORTAL_ACCESS_KEY,
  },
  guestExperienceSettings: {
    ...fiestaBase.guestExperienceSettings,
    enabled: true,
    showCheckin: true,
    showMesaAsignada: true,
  },
};
const otraFiesta = { ...fiesta, id: `${PREFIX}_otra`, invitados: [] };
const fixturePaths = DATA_DIRS.map((dir) => path.join(dir, `${fiesta.id}.json`));
const otherFixturePaths = DATA_DIRS.map((dir) => path.join(dir, `${otraFiesta.id}.json`));
const snapshots = fixturePaths.map((file) => ({
  file,
  existed: fs.existsSync(file),
  contents: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined,
}));
const otherSnapshots = otherFixturePaths.map((file) => ({
  file,
  existed: fs.existsSync(file),
  contents: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : undefined,
}));

function writeFixture(value: unknown) {
  for (const file of fixturePaths) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
  }
}

function readFixture() {
  const file = fixturePaths.find((candidate) => fs.existsSync(candidate));
  return file ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

function cleanupFixture() {
  for (const snapshot of [...snapshots, ...otherSnapshots]) {
    if (snapshot.existed && snapshot.contents !== undefined) {
      fs.writeFileSync(snapshot.file, snapshot.contents);
    } else if (fs.existsSync(snapshot.file)) {
      fs.unlinkSync(snapshot.file);
    }
  }
}

async function decodedQrFromPng(page: import('@playwright/test').Page, pngPath: string) {
  const pngBase64 = fs.readFileSync(pngPath).toString('base64');
  const pixels = await page.evaluate(async (base64: string) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const gray = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0, j = 0; i < rgba.length; i += 4, j += 1) {
      gray[j] = Math.round(0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]);
    }
    return { width: canvas.width, height: canvas.height, gray: Array.from(gray) };
  }, pngBase64);
  const luminance = new zxing.RGBLuminanceSource(Uint8ClampedArray.from(pixels.gray), pixels.width, pixels.height);
  return new zxing.QRCodeReader().decode(new zxing.BinaryBitmap(new zxing.HybridBinarizer(luminance))).getText();
}

test('el QR descargado identifica al invitado y el lector del equipo registra su entrada', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(90_000);
  writeFixture(fiesta);
  const jsErrors: string[] = [];
  page.on('pageerror', (error) => jsErrors.push(error.message));

  try {
    await page.goto(`${baseURL}/invitacion/${fiesta.id}/rsvp`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Confirmar asistencia' })).toBeVisible({ timeout: 45_000 });
    await page.locator('#nombre').fill(GUEST_NAME);
    await page.locator('#contacto').fill('099 111 222');
    await page.getByRole('button', { name: '✅ Sí, voy!' }).click();
    await page.getByRole('button', { name: '+', exact: true }).click();
    await page.getByRole('button', { name: '+', exact: true }).click();
    await page.getByPlaceholder('Acompañante 1').fill(COMPANION_NAMES[0]);
    await page.getByPlaceholder('Acompañante 2').fill(COMPANION_NAMES[1]);
    await page.locator('#diet-Vegetariano').check();
    await page.getByRole('button', { name: 'Confirmar asistencia' }).click();
    await expect(page.getByTestId('guest-qr-container')).toBeVisible({ timeout: 45_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Descargar QR/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^QR-Entrada-.+\.png$/i);
    const pngPath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(pngPath);
    const png = fs.readFileSync(pngPath);
    expect(png.length).toBeGreaterThan(100);
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    await testInfo.attach('entrada-QR-descargada.png', { path: pngPath, contentType: 'image/png' });

    const saved = readFixture();
    const guest = saved?.invitados?.find((item: any) => item.nombre === GUEST_NAME);
    expect(guest?.rsvp).toBe('Confirmado');
    expect(guest?.partySize).toBe(3);
    expect(guest?.guestAccessToken).toBeTruthy();
    expect(guest?.companionNames).toEqual(COMPANION_NAMES);
    expect(guest?.tableNumber).toBe('7');
    expect(guest?.dietaryRestriction).toBe('Vegetariano');
    expect(guest?.checkedIn).not.toBe(true);
    expect(saved?.invitados?.find((item: any) => item.id === `${PREFIX}_other`)).toEqual(fiesta.invitados[1]);
    expect(saved?.clientPortalSettings?.accessKey).toBe(PORTAL_ACCESS_KEY);
    expect(saved?.invitados?.some((item: any) => COMPANION_NAMES.includes(item.nombre))).toBe(false);

    const decodedUrl = await decodedQrFromPng(page, pngPath);
    await testInfo.attach('destino-QR-decodificado.txt', { body: decodedUrl, contentType: 'text/plain' });

    const decoded = new URL(decodedUrl);
    const localOrigin = new URL(baseURL!);
    expect(localOrigin.origin).toBe('http://127.0.0.1:3300');
    expect(decoded.origin).toBe(localOrigin.origin);
    expect(decoded.pathname).toBe(`/evento/accesos/${fiesta.id}`);
    expect(decoded.searchParams.get('fiestaId')).toBe(fiesta.id);
    expect(decoded.searchParams.get('guestId')).toBe(guest.id);
    expect(decoded.searchParams.get('token')).toBe(guest.guestAccessToken);

    const portalLink = page.getByTestId('guest-portal-link');
    await expect(portalLink).toHaveAttribute('href', new RegExp(`^/invitacion/${fiesta.id}/invitado/${guest.id}\\?token=`));
    const portalHref = await portalLink.getAttribute('href');
    const personalUrl = new URL(portalHref!, localOrigin.origin);
    expect(personalUrl.origin).toBe(localOrigin.origin);
    expect(personalUrl.searchParams.get('token')).toBe(guest.guestAccessToken);
    await portalLink.click();
    await expect(page.getByText(GUEST_NAME, { exact: true }).first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('guest-portal-qr')).toBeVisible();
    await expect(page.getByText('Credencial de entrada', { exact: true })).toBeVisible();
    await expect(page.getByTestId('guest-portal-table')).toBeVisible();
    await expect(page.getByText(`Mesa ${guest.tableNumber}`, { exact: true })).toBeVisible();
    await expect(page.getByText('Salon E2E A85', { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId('guest-portal-dietary')).toContainText('Vegetariano');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: GUEST_NAME, exact: true })).toBeVisible();
    await expect(page.getByTestId('guest-portal-table')).toContainText('Mesa 7');
    expect((await page.context().cookies()).some((c) => c.name === 'ak_session')).toBe(false);
    await expect(page.getByRole('button', { name: /Llegué|Registrar llegada|Control de llegada/i })).toHaveCount(0);
    expect(jsErrors).toEqual([]);

    const operatorContext = await page.context().browser()!.newContext({ baseURL: localOrigin.origin });
    const operatorPage = await operatorContext.newPage();
    try {
      await ponerSesionDelEquipo(operatorContext, localOrigin.origin);
      await enchufarCamaraFalsa(operatorPage);
      await operatorPage.goto(`/evento/accesos/${fiesta.id}`, { waitUntil: 'domcontentloaded' });
      const fileMode = operatorPage.locator('#html5-qrcode-anchor-scan-type-change');
      await expect(fileMode).toBeVisible({ timeout: 20_000 });
      await expect(fileMode).toHaveText('Scan an Image File');
      await fileMode.click();
      const imageInput = operatorPage.locator('#qr-acceso-reader input[type="file"]');
      await expect(imageInput).toBeAttached({ timeout: 10_000 });
      await imageInput.setInputFiles(pngPath);
      await expect(operatorPage.getByText('✅ ACCESO PERMITIDO', { exact: true })).toBeVisible({ timeout: 20_000 });
      await expect(operatorPage.getByText(GUEST_NAME, { exact: true })).toBeVisible();
      await expect(operatorPage.getByText(`Mesa: ${guest.tableNumber}`, { exact: false })).toBeVisible();

      const checkedIn = leerFiesta(fiesta.id);
      const checkedGuest = checkedIn.invitados.find((item: any) => item.id === guest.id);
      expect(checkedGuest.checkedIn).toBe(true);
      expect(checkedGuest.checkInTimestamp).toBeTruthy();
      expect(checkedIn.invitados.find((item: any) => item.id === `${PREFIX}_other`)).toEqual(fiesta.invitados[1]);
      await testInfo.attach('lector-entrada-guardada.png', { body: await operatorPage.screenshot(), contentType: 'image/png' });
      for (const companionName of COMPANION_NAMES) {
        expect(checkedIn.invitados.some((item: any) => item.nombre === companionName)).toBe(false);
      }
    } finally {
      await operatorContext.close();
    }
  } finally {
    cleanupFixture();
  }
});

test('el token de una fiesta no abre la credencial de otra aunque coincida el id de invitado', async ({ page, baseURL }, testInfo) => {
  test.setTimeout(60_000);
  const wrongGuest = {
    id: `${PREFIX}_guest`,
    nombre: 'Invitado Privado de Otra Fiesta A85',
    rsvp: 'Confirmado',
    partySize: 1,
    guestAccessToken: `${PREFIX}_wrong_token`,
    tableNumber: '19',
  };
  const wrongFiesta = { ...otraFiesta, invitados: [wrongGuest] };
  guardarFiesta(wrongFiesta as any);
  writeFixture(fiesta);

  try {
    await page.goto(`${baseURL}/invitacion/${fiesta.id}/rsvp`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Confirmar asistencia' })).toBeVisible({ timeout: 45_000 });
    await page.locator('#nombre').fill(GUEST_NAME);
    await page.getByRole('button', { name: '✅ Sí, voy!' }).click();
    await page.getByRole('button', { name: 'Confirmar asistencia' }).click();
    await expect(page.getByTestId('guest-qr-container')).toBeVisible({ timeout: 45_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Descargar QR/i }).click();
    const download = await downloadPromise;
    const pngPath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(pngPath);
    const decoded = new URL(await decodedQrFromPng(page, pngPath));
    const guest = readFixture()?.invitados?.find((item: any) => item.nombre === GUEST_NAME);
    expect(decoded.searchParams.get('guestId')).toBe(guest.id);
    const wrongBefore = leerFiesta(otraFiesta.id);
    const originalBefore = readFixture();
    const mismatchContext = await page.context().browser()!.newContext({ baseURL: new URL(baseURL!).origin });
    const mismatchPage = await mismatchContext.newPage();
    try {
      const wrongPortal = new URL(`/invitacion/${otraFiesta.id}/invitado/${guest.id}`, baseURL);
      wrongPortal.searchParams.set('token', decoded.searchParams.get('token')!);
      await mismatchPage.goto(wrongPortal.toString(), { waitUntil: 'domcontentloaded' });
      await expect(mismatchPage.getByRole('heading', { name: 'No pudimos abrir tu invitación', exact: true })).toBeVisible({ timeout: 20_000 });
      await expect(mismatchPage.getByText(wrongGuest.nombre, { exact: true })).toHaveCount(0);
      await expect(mismatchPage.getByTestId('guest-portal-qr')).toHaveCount(0);
      expect((await mismatchContext.cookies()).some((c) => c.name === 'ak_session')).toBe(false);
      expect(leerFiesta(otraFiesta.id)).toEqual(wrongBefore);
      expect(readFixture()).toEqual(originalBefore);
    } finally {
      await mismatchContext.close();
    }
  } finally {
    cleanupFixture();
  }
});

/*
 * Ejecucion manual, una vez por viewport:
 * node docs/evidencias/81-correr-e2e-aislado.mjs %TEMP%\ak-entorno-aislado-SkNAHJ tests/e2e/85-invitado-entrada-real.spec.ts --project=chromium-desktop --workers=1 --retries=0
 * node docs/evidencias/81-correr-e2e-aislado.mjs %TEMP%\ak-entorno-aislado-SkNAHJ tests/e2e/85-invitado-entrada-real.spec.ts --project=chromium-mobile --workers=1 --retries=0
 * Copiar este archivo a tests/e2e/85-invitado-entrada-real.spec.ts antes de correr.
 */
