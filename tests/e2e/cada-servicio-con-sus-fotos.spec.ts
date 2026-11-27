import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Orden 348:
 * - En /presentacion-led, el servicio con fotos muestra "Ver fotos (N)" y abre
 *   solo las fotos de ese servicio.
 * - Escribir "agregá Fotocabina" en "Pedile a la IA" (con respuesta simulada)
 *   lo marca elegido, actualiza el total en pantalla y "Deshacer" lo vuelve atrás.
 */

const DATA_GALERIA_PATH = path.join(process.cwd(), 'data', 'galeria-publica.json');
const SRC_GALERIA_PATH = path.join(process.cwd(), 'src', 'data', 'galeria-publica.json');

let teniaDataGaleria = false;
let dataGaleriaOriginal = '';

test.beforeAll(() => {
  const baseRaw = fs.existsSync(DATA_GALERIA_PATH)
    ? ((teniaDataGaleria = true), (dataGaleriaOriginal = fs.readFileSync(DATA_GALERIA_PATH, 'utf8')))
    : fs.readFileSync(SRC_GALERIA_PATH, 'utf8');

  const parsed = JSON.parse(baseRaw) as { fotos: any[]; videos: any[] };
  parsed.fotos = [
    ...(parsed.fotos || []),
    {
      id: 'e2e_foto_fotocabina_1',
      tipo: 'foto',
      url: '/media/catalogo-servicios/photobooth-vogue-01.jpeg',
      titulo: 'Foto exclusiva de Fotocabina E2E',
      categoria: 'Fotografía',
      servicioId: 'serv_fotocabina',
      servicio: 'Fotocabina',
      destacada: true,
      orden: 0,
      createdAt: '2026-11-25T10:00:00.000Z',
    },
    {
      id: 'e2e_foto_vogue_1',
      tipo: 'foto',
      url: '/media/catalogo-servicios/salon-discoteca-ak-01.jpeg',
      titulo: 'Foto exclusiva de Vogue E2E',
      categoria: 'Fotografía',
      servicioId: 'serv_bogue',
      servicio: 'Vogue',
      destacada: true,
      orden: 1,
      createdAt: '2026-11-25T10:00:00.000Z',
    },
  ];

  fs.mkdirSync(path.dirname(DATA_GALERIA_PATH), { recursive: true });
  fs.writeFileSync(DATA_GALERIA_PATH, JSON.stringify(parsed, null, 2), 'utf8');
});

test.afterAll(() => {
  if (teniaDataGaleria) {
    fs.writeFileSync(DATA_GALERIA_PATH, dataGaleriaOriginal, 'utf8');
  } else if (fs.existsSync(DATA_GALERIA_PATH)) {
    fs.unlinkSync(DATA_GALERIA_PATH);
  }
});

test.describe('Orden 348 — Álbum por servicio y Pedile a la IA en la presentación LED', () => {
  test('muestra Ver fotos sólo de ese servicio, agrega con Pedile a la IA cambiando el total y Deshacer revierte', async ({ page }) => {
    test.setTimeout(180_000);

    await page.route('**/*', async (route) => {
      const req = route.request();
      if (
        req.method() === 'POST' &&
        req.headers()['next-action'] &&
        (req.postData() || '').includes('agregá Fotocabina')
      ) {
        const respuestaSimulada = {
          ok: true,
          accion: 'agregar',
          servicioId: 'serv_fotocabina',
          servicioNombre: 'Fotocabina',
        };
        await route.fulfill({
          status: 200,
          headers: { 'content-type': 'text/x-component' },
          body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify(respuestaSimulada)}\n`,
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/presentacion-led', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await expect(page.getByText(/Cargando presentaci/i)).toBeHidden({ timeout: 60_000 });

    // 1. Probar "Pedile a la IA" -> agregar Fotocabina y verificar que cambia el total y Deshacer vuelve atrás
    const btnPedileIA = page.getByTestId('btn-pedile-a-la-ia');
    await expect(btnPedileIA).toBeVisible({ timeout: 15_000 });
    await btnPedileIA.click();

    const inputIA = page.getByTestId('input-pedile-a-la-ia');
    await expect(inputIA).toBeVisible();
    await inputIA.fill('agregá Fotocabina');
    await page.getByTestId('btn-enviar-pedile-ia').click();

    await expect(page.getByTestId('banner-pedile-ia')).toContainText('Agregado: Fotocabina', { timeout: 15_000 });
    await expect(page.getByText('1 servicio', { exact: true })).toBeVisible();
    await expect(page.getByText(/\$2\.990/)).toBeVisible();

    await page.getByTestId('btn-deshacer-pedile-ia').click();
    await expect(page.getByTestId('banner-pedile-ia')).toBeHidden();
    await expect(page.getByText('1 servicio', { exact: true })).toBeHidden();

    // 2. Avanzar hasta la diapositiva de "Servicio de entretenimiento" donde aparece Fotocabina
    const btnVerFotosFotocabina = page.getByTestId('ver-fotos-servicio-serv_fotocabina');
    const btnSiguiente = page.getByTestId('btn-siguiente-slide');
    for (let i = 0; i < 25; i++) {
      if (await btnVerFotosFotocabina.isVisible().catch(() => false)) break;
      if (await btnSiguiente.isVisible().catch(() => false)) {
        await btnSiguiente.click().catch(() => page.keyboard.press('ArrowRight'));
      } else {
        await page.keyboard.press('ArrowRight');
      }
      await page.waitForTimeout(250);
    }

    await expect(btnVerFotosFotocabina).toBeVisible({ timeout: 15_000 });
    await expect(btnVerFotosFotocabina).toContainText('Ver fotos (1)');
    await btnVerFotosFotocabina.click();

    await expect(page.getByText('Foto exclusiva de Fotocabina E2E')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Foto exclusiva de Vogue E2E')).toBeHidden();
  });
});
