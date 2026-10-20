import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, guardarFiesta, leerFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

test.use({ serviceWorkers: 'block' });
test.skip(
  process.env.AK_ENTORNO_AISLADO !== 'true'
    || process.env.AK_USE_LOCAL_JSON_ONLY !== 'true'
    || process.env.PLAYWRIGHT_BASE_URL !== 'http://127.0.0.1:3300',
  'Requires the disposable synthetic QA runner on localhost.',
);
test.beforeEach(async ({ context }, testInfo) => {
  await context.addInitScript(() => {
    Reflect.deleteProperty(Navigator.prototype, 'serviceWorker');
  });
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (/^https?:$/.test(url.protocol) && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
      await testInfo.attach('blocked-external-url', { contentType: 'text/plain', body: `${url.origin}${url.pathname}` });
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
});

/**
 * Orden 147 (Codex, QR94-LECTOR): el QR que baja "Guardar QR" lo lee el Control de Acceso de la app.
 *
 * Se descarga el archivo con el botón real del portal del invitado y se le entregan EXACTAMENTE esos
 * bytes al lector real (html5-qrcode, por archivo) de la pantalla de accesos: el archivo no se retoca
 * ni se genera otro QR ni se llama la acción a mano. Se mira el resultado: el invitado queda con
 * `checkedIn`, la segunda lectura no le cambia la hora de entrada, y el archivo trae módulos enteros y zona blanca. Se prueban un token corto y uno largo (códigos de distinto tamaño).
 *
 * Probado rompiéndolo: volver `downloadQR` a bajar el canvas pelado (`canvas.toDataURL`) deja el
 * archivo sin margen y con bordes grises, y esta prueba se pone en rojo en la franja y en los grises.
 */

const CASOS = [
  { etiqueta: 'token corto', token: 'qa147corto' },
  { etiqueta: 'token largo', token: randomUUID() },
];

for (const caso of CASOS) {
  test(`el QR descargado con ${caso.etiqueta} entra por el lector real`, async ({ page, context, baseURL }) => {
    test.setTimeout(180_000);
    const id = `e2e_qr147_${caso.token.length}_${Date.now()}`;
    const gid = `g147_${caso.token.length}`;
    const fiesta: any = crearFiestaDeEstaNoche({ id });
    fiesta.invitados = [{
      id: gid, nombre: 'Invitado QR ciento cuarenta y siete', rsvp: 'Confirmado', categoria: 'Adulto',
      partySize: 2, guestAccessToken: caso.token, checkedIn: false,
    }];
    guardarFiesta(fiesta);
    try {
      // 1) El invitado baja su QR con el botón real.
      await page.goto(`/invitacion/${id}/invitado/${gid}?token=${encodeURIComponent(caso.token)}`, { waitUntil: 'domcontentloaded' });
      const guardar = page.getByRole('button', { name: /Guardar QR/ });
      await expect(guardar).toBeVisible({ timeout: 60_000 });
      const [descarga] = await Promise.all([page.waitForEvent('download'), guardar.click()]);
      const ruta = await descarga.path();
      const bytes = fs.readFileSync(ruta!);

      // El archivo es un PNG cuadrado con módulos enteros: ningún píxel gris (sin bordes difuminados) y
      // la franja superior (zona blanca) toda blanca. El tamaño no depende del devicePixelRatio.
      expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
      const ancho = bytes.readUInt32BE(16);
      const alto = bytes.readUInt32BE(20);
      expect(alto).toBe(ancho);
      const medida = await page.evaluate(async (b64) => {
        const img = new Image();
        img.src = 'data:image/png;base64,' + b64;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.naturalWidth; c.height = img.naturalHeight;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const todo = ctx.getImageData(0, 0, c.width, c.height).data;
        let grises = 0;
        for (let i = 0; i < todo.length; i += 4) if (todo[i] !== 0 && todo[i] !== 255) grises++;
        // Franja superior del 8% del archivo (el margen son 8 módulos: entre 9% y 14% según el código): toda blanca.
        const franja = Math.floor(img.naturalWidth * 0.08);
        const d = ctx.getImageData(0, 0, c.width, franja).data;
        let oscuros = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] < 128) oscuros++;
        return { grises, oscuros };
      }, bytes.toString('base64'));
      expect(medida.grises, 'los módulos son enteros: no hay píxeles grises').toBe(0);
      expect(medida.oscuros, 'la franja superior del archivo debe ser zona blanca').toBe(0);
      expect(ancho % 4, 'cada módulo mide un número entero de píxeles (4)').toBe(0);

      // 2) El equipo entrega EXACTAMENTE esos bytes al lector real de accesos.
      await ponerSesionDelEquipo(context, baseURL);
      await enchufarCamaraFalsa(page);
      await page.goto(`/evento/accesos/${id}`, { waitUntil: 'domcontentloaded' });
      const cambiar = page.locator('#html5-qrcode-anchor-scan-type-change');
      await expect(cambiar).toBeVisible({ timeout: 60_000 });
      await cambiar.click();
      const entrada = page.locator('#qr-acceso-reader input[type=file]');
      await entrada.setInputFiles({ name: 'QR-Entrada.png', mimeType: 'image/png', buffer: bytes });

      await expect.poll(() => leerFiesta(id)?.invitados?.[0]?.checkedIn, { timeout: 60_000 }).toBe(true);
      const primera = leerFiesta(id).invitados[0].checkInTimestamp;
      expect(primera).toBeTruthy();

      // 3) Repetir la lectura no cambia la hora de la primera entrada.
      await page.waitForTimeout(7000);
      await entrada.setInputFiles([]);
      await entrada.setInputFiles({ name: 'QR-Entrada.png', mimeType: 'image/png', buffer: bytes });
      await page.waitForTimeout(8000);
      expect(leerFiesta(id).invitados[0].checkInTimestamp).toBe(primera);
    } finally {
      borrarFiesta(id);
    }
  });
}
