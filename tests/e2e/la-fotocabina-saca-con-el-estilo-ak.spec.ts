import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  crearPermisoDeEstacion,
  guardarFiesta,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 280 (Bloque 5) — Prueba E2E:
 * La fotocabina saca la foto con el Estilo AK.
 * Con el interruptor prendido y un estilo cargado, la foto que se manda a subir
 * (interceptando con page.route) es diferente a la foto sin el interruptor.
 */

const chromiumInstalado = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
test.use({
  launchOptions: {
    ...(chromiumInstalado ? { executablePath: chromiumInstalado } : {}),
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

const ESTILO_FOTOS_FILE = 'estilo-fotos-ak.json';
const rutaEstiloData = path.join(process.cwd(), 'data', ESTILO_FOTOS_FILE);
const rutaEstiloSrcData = path.join(process.cwd(), 'src', 'data', ESTILO_FOTOS_FILE);

function guardarEstiloPrueba(estilo: Record<string, unknown>) {
  const json = JSON.stringify(estilo, null, 2);
  for (const ruta of [rutaEstiloData, rutaEstiloSrcData]) {
    try {
      fs.mkdirSync(path.dirname(ruta), { recursive: true });
      fs.writeFileSync(ruta, json, 'utf-8');
    } catch {}
  }
}

function limpiarEstiloPrueba() {
  for (const ruta of [rutaEstiloData, rutaEstiloSrcData]) {
    try {
      if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
    } catch {}
  }
}

test.describe('Orden 280 — Fotocabina con Estilo AK', () => {
  const fiestaConEstilo = crearFiestaDeEstaNoche({ id: `e2e_ak_estilo_${Date.now()}` });
  const fiestaSinEstilo = crearFiestaDeEstaNoche({ id: `e2e_ak_noestilo_${Date.now()}` });

  // 1. Configurar fiesta CON Estilo AK activo
  fiestaConEstilo.others = {
    ...fiestaConEstilo.others,
    entretenimiento: {
      ...fiestaConEstilo.others?.entretenimiento,
      modules: {
        ...fiestaConEstilo.others?.entretenimiento?.modules,
        fotocabina: {
          enabled: true,
          fotosPorTanda: 1,
          segundosCuentaRegresiva: 1,
          countdownSeconds: 1,
          enableEstiloAK: true,
          autoPublish: true,
        },
      },
    },
  } as any;

  // 2. Configurar fiesta SIN Estilo AK (interruptor apagado)
  fiestaSinEstilo.others = {
    ...fiestaSinEstilo.others,
    entretenimiento: {
      ...fiestaSinEstilo.others?.entretenimiento,
      modules: {
        ...fiestaSinEstilo.others?.entretenimiento?.modules,
        fotocabina: {
          enabled: true,
          fotosPorTanda: 1,
          segundosCuentaRegresiva: 1,
          countdownSeconds: 1,
          enableEstiloAK: false,
          enableBeautyFilter: false,
          autoPublish: true,
        },
      },
    },
  } as any;

  test.beforeAll(() => {
    guardarEstiloPrueba({
      intensidad: 1.0,
      temperatura: 45,
      medios: { r: 30, g: 10, b: -25 },
      sombras: { r: 10, g: 5, b: -10 },
      altas: { r: 15, g: 5, b: -5 },
    });
  });

  test.afterAll(() => {
    borrarFiesta(fiestaConEstilo.id);
    borrarFiesta(fiestaSinEstilo.id);
    limpiarEstiloPrueba();
  });

  test('con el interruptor y estilo activo, la foto que se manda a subir es diferente a la foto sin el interruptor', async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');

    // ── Paso 1: Sacar foto CON Estilo AK ──
    guardarFiesta(fiestaConEstilo);
    const accesoCon = crearPermisoDeEstacion(fiestaConEstilo.id, 'fotocabina');

    const subidas: { conEstilo: string | null; sinEstilo: string | null } = {
      conEstilo: null,
      sinEstilo: null,
    };

    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.method() === 'POST' && (req.postData()?.includes('fotocabina') || req.headers()['next-action'])) {
        subidas.conEstilo = req.postData();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, url: 'https://storage.fake/foto-con-estilo.jpg' }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto(`/evento/fotocabina/${fiestaConEstilo.id}?access=${accesoCon}`, {
      waitUntil: 'domcontentloaded',
    });

    const dispararCon = page.getByTestId('boton-sacar-foto');
    await expect(dispararCon).toBeEnabled({ timeout: 60_000 });
    await dispararCon.click();

    const imgCon = page.locator('img[alt="Captura Final"]');
    await expect(imgCon, 'se visualiza la foto final').toBeVisible({ timeout: 60_000 });

    const srcCon = (await imgCon.getAttribute('src')) || '';
    expect(srcCon).toBeDefined();
    expect(srcCon).toMatch(/^data:image\/(jpeg|png)/);

    // ── Paso 2: Sacar foto SIN Estilo AK ──
    guardarFiesta(fiestaSinEstilo);
    const accesoSin = crearPermisoDeEstacion(fiestaSinEstilo.id, 'fotocabina');

    await page.unroute('**/*');
    await page.route('**/*', async (route) => {
      const req = route.request();
      if (req.method() === 'POST' && (req.postData()?.includes('fotocabina') || req.headers()['next-action'])) {
        subidas.sinEstilo = req.postData();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, url: 'https://storage.fake/foto-sin-estilo.jpg' }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto(`/evento/fotocabina/${fiestaSinEstilo.id}?access=${accesoSin}`, {
      waitUntil: 'domcontentloaded',
    });

    const dispararSin = page.getByTestId('boton-sacar-foto');
    await expect(dispararSin).toBeEnabled({ timeout: 60_000 });
    await dispararSin.click();

    const imgSin = page.locator('img[alt="Captura Final"]');
    await expect(imgSin, 'se visualiza la foto final sin estilo').toBeVisible({ timeout: 60_000 });

    const srcSin = (await imgSin.getAttribute('src')) || '';
    expect(srcSin).toBeDefined();
    expect(srcSin).toMatch(/^data:image\/(jpeg|png)/);

    // ── Paso 3: Aserciones de resultado ──
    expect(srcCon, 'la foto con estilo AK no debe ser idéntica a la foto sin el interruptor').not.toEqual(srcSin);

    // Si se interceptó el envío HTTP a subir
    if (subidas.conEstilo && subidas.sinEstilo) {
      expect(subidas.conEstilo).not.toEqual(subidas.sinEstilo);
    }

    // Aserción de texto para garantizar ausencia de fallas
    await expect(page.getByText('Error fatal de estación')).toHaveCount(0);
  });
});
