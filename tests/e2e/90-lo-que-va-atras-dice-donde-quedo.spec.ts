import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearPermisoDeEstacion,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

/**
 * Orden 90 — Bloque 2: Lo que se hace "atrás" dice dónde quedó de verdad.
 *
 * En la fotocabina y el 360:
 * - Con la subida cortada (route.abort('internetdisconnected') sobre el POST de subida),
 *   la pantalla dice que quedó en el equipo y NUNCA "subida" ni "galería".
 * - Con la subida rechazada (responder {success:false,error:'Contenido inapropiado'}),
 *   la pantalla informa el rechazo y NO dice "se sube sola" ni que quedó guardada.
 */

const fiestaId = `e2e_orden_90_${Date.now()}`;
const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });

if (!fiesta.others) (fiesta as any).others = {};
if (!(fiesta as any).others.entretenimiento) (fiesta as any).others.entretenimiento = {};
if (!(fiesta as any).others.entretenimiento.modules) (fiesta as any).others.entretenimiento.modules = {};

(fiesta as any).others.entretenimiento.modules.fotocabina = {
  fotosPorTanda: 1,
  countdownSeconds: 2,
  segundosCuentaRegresiva: 2,
  autoPublish: false,
};

(fiesta as any).others.entretenimiento.modules.plataforma360 = {
  countdownSeconds: 2,
  recordingDurationSeconds: 2,
};

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

async function esperarCamaraLista(page: any) {
  for (let intento = 0; intento < 15; intento++) {
    const hayCamara = await page.evaluate(() => {
      const v = document.querySelector('video');
      return Boolean(v && (v as HTMLVideoElement).srcObject);
    });
    if (hayCamara) {
      await page.waitForTimeout(500);
      return;
    }
    await page.waitForTimeout(1_000);
  }
}

function simularRechazoAction(texto: string, mensajeError: string) {
  let resultado = texto;
  if (resultado.includes('"error"')) {
    resultado = resultado.replace(/"error"\s*:\s*"[^"]*"/g, `"error":"${mensajeError}"`);
  } else {
    resultado = resultado.replace(/"success"\s*:\s*(true|false)/, `"success":false,"error":"${mensajeError}"`);
  }
  return resultado.replace(/"success"\s*:\s*true/g, '"success":false');
}

test.describe('Orden 90 — Bloque 2: la pantalla dice la verdad según dónde quedó la captura', () => {
  test('Fotocabina con corte de red: dice guardada en el equipo y NUNCA subida ni galería', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);
    await enchufarCamaraFalsa(page);

    await page.route('**/evento/fotocabina/**', async (route) => {
      const req = route.request();
      const contentType = req.headers()['content-type'] || '';
      if (req.method() === 'POST' && contentType.includes('multipart/form-data')) {
        await route.abort('internetdisconnected');
        return;
      }
      await route.continue();
    });

    const permiso = crearPermisoDeEstacion(fiesta.id, 'fotocabina');
    await page.goto(`/evento/fotocabina/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });
    await esperarCamaraLista(page);

    const btnCaptura = page.locator('[data-testid="boton-sacar-foto"]').or(page.getByRole('button', { name: /preparar foto|sacar/i })).first();
    await expect(btnCaptura).toBeVisible({ timeout: 25_000 });
    await btnCaptura.click();

    // Esperar a que pase la captura y aparezca la vista previa con el botón para publicar
    const btnPublicar = page.getByRole('button', { name: /publicar en el muro/i });
    await expect(btnPublicar).toBeVisible({ timeout: 25_000 });
    await btnPublicar.click();

    // Debe mostrar que quedó guardada en el equipo
    const avisoEquipo = page.getByText(/guardada en este equipo|quedó guardada/i).first();
    await expect(avisoEquipo).toBeVisible({ timeout: 35_000 });

    // Y NUNCA debe decir "subida" ni "en la galería"
    const textoPagina = (await page.locator('body').innerText()).toLowerCase();
    expect(textoPagina).not.toMatch(/ya se subió|ya está subida|en la galería de la fiesta|tu recuerdo esta listo/i);
  });

  test('Fotocabina con subida rechazada: muestra el error y NO dice que se sube sola', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);
    await enchufarCamaraFalsa(page);

    await page.route('**/evento/fotocabina/**', async (route) => {
      const req = route.request();
      const contentType = req.headers()['content-type'] || '';
      if (req.method() === 'POST' && contentType.includes('multipart/form-data')) {
        const respuesta = await route.fetch();
        const texto = await respuesta.text();
        const nuevoTexto = simularRechazoAction(texto, 'Contenido inapropiado');
        await route.fulfill({ response: respuesta, body: nuevoTexto });
        return;
      }
      await route.continue();
    });

    const permiso = crearPermisoDeEstacion(fiesta.id, 'fotocabina');
    await page.goto(`/evento/fotocabina/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });
    await esperarCamaraLista(page);

    const btnCaptura = page.locator('[data-testid="boton-sacar-foto"]').or(page.getByRole('button', { name: /preparar foto|sacar/i })).first();
    await expect(btnCaptura).toBeVisible({ timeout: 25_000 });
    await btnCaptura.click();

    const btnPublicar = page.getByRole('button', { name: /publicar en el muro/i });
    await expect(btnPublicar).toBeVisible({ timeout: 25_000 });
    await btnPublicar.click();

    // Debe informar el error de rechazo
    const avisoError = page.getByText(/no se pudo publicar|contenido inapropiado/i).first();
    await expect(avisoError).toBeVisible({ timeout: 35_000 });

    // Y NO debe decir que se sube sola ni que quedó guardada
    const textoPagina = (await page.locator('body').innerText()).toLowerCase();
    expect(textoPagina).not.toMatch(/se sube sola|se subirá cuando vuelva la señal|guardada en este equipo/i);
  });

  test('Plataforma 360 con corte de red: dice guardado en el equipo y NUNCA subido ni galería', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);
    await enchufarCamaraFalsa(page);

    await page.route('**/evento/plataforma-360/**', async (route) => {
      const req = route.request();
      const contentType = req.headers()['content-type'] || '';
      if (req.method() === 'POST' && contentType.includes('multipart/form-data')) {
        await route.abort('internetdisconnected');
        return;
      }
      await route.continue();
    });

    const permiso = crearPermisoDeEstacion(fiesta.id, 'plataforma360');
    await page.goto(`/evento/plataforma-360/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });

    const btnGrabar = page.getByRole('button', { name: /grabar video/i }).first();
    await expect(btnGrabar).toBeVisible({ timeout: 20_000 });
    await btnGrabar.click();

    // Debe mostrar que quedó guardado en el equipo
    const avisoEquipo = page.getByText(/video guardado en este equipo|quedó guardado/i).first();
    await expect(avisoEquipo).toBeVisible({ timeout: 45_000 });

    // Y NUNCA debe decir subido ni en la galería
    const textoPagina = (await page.locator('body').innerText()).toLowerCase();
    expect(textoPagina).not.toMatch(/tu video ya está subido|en la galería/i);
  });

  test('Plataforma 360 con subida rechazada: muestra el error y NO dice que se sube sola', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);
    await enchufarCamaraFalsa(page);

    await page.route('**/evento/plataforma-360/**', async (route) => {
      const req = route.request();
      const contentType = req.headers()['content-type'] || '';
      if (req.method() === 'POST' && contentType.includes('multipart/form-data')) {
        const respuesta = await route.fetch();
        const texto = await respuesta.text();
        const nuevoTexto = simularRechazoAction(texto, 'Contenido inapropiado');
        await route.fulfill({ response: respuesta, body: nuevoTexto });
        return;
      }
      await route.continue();
    });

    const permiso = crearPermisoDeEstacion(fiesta.id, 'plataforma360');
    await page.goto(`/evento/plataforma-360/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });

    const btnGrabar = page.getByRole('button', { name: /grabar video/i }).first();
    await expect(btnGrabar).toBeVisible({ timeout: 20_000 });
    await btnGrabar.click();

    // Debe mostrar el rechazo
    const avisoError = page.getByText(/contenido inapropiado|no se pudo publicar/i).first();
    await expect(avisoError).toBeVisible({ timeout: 45_000 });

    // Y NO debe decir que se sube sola ni que quedó guardado en esta pantalla
    const textoPagina = (await page.locator('body').innerText()).toLowerCase();
    expect(textoPagina).not.toMatch(/se sube sola|se subirá cuando vuelva la señal|quedó guardado en esta pantalla/i);
  });
});
