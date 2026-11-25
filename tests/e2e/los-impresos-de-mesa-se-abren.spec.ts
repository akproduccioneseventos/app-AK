import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  guardarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

let fiestaId = '';

const IMPRESOS = [
  {
    cardTitle: 'Cartelería de Mesas',
    oldPath: '/fiestas/nueva/carteleria',
    tab: 'carteleria',
    heading: 'Generador de Cartelería de Mesas',
    printSelector: { type: 'role' as const, name: /Descargar Kit PDF/i },
  },
  {
    cardTitle: 'Menú de Mesa',
    oldPath: '/fiestas/nueva/menu-mesa',
    tab: 'menu-mesa',
    heading: 'Editor de Menú de Mesa',
    // Orden 341: el botón de imprimir arma el PDF en milímetros exactos y se llama "Imprimir".
    printSelector: { type: 'title' as const, value: 'Imprimir' },
  },
  {
    cardTitle: 'Números de Mesa',
    oldPath: '/fiestas/nueva/numeros-mesa',
    tab: 'numeros-mesa',
    heading: 'Torres de Mesa A4',
    printSelector: { type: 'role' as const, name: /Imprimir PDF A4 completo/i },
  },
  {
    cardTitle: 'Carta de Tragos',
    oldPath: '/fiestas/nueva/carta-tragos',
    tab: 'carta-tragos',
    // Orden 341: el formato por omisión pasó a 10×15 vertical, dos por hoja A4.
    heading: 'Editor de Carta de Tragos',
    printSelector: { type: 'title' as const, value: 'Imprimir' },
  },
];

test.beforeAll(() => {
  const sufijo = String(Math.floor(100000 + Math.random() * 900000));
  const fiesta = crearFiestaDeEstaNoche({ id: `e2e_impresos_${Date.now()}_${sufijo}` });
  if (fiesta.modulosContratados) {
    (fiesta.modulosContratados as unknown as Record<string, boolean>).cartaTragos = true;
  }
  guardarFiesta(fiesta);
  fiestaId = fiesta.id;
});

test.afterAll(() => {
  if (fiestaId) borrarFiesta(fiestaId);
});

test.describe('Orden 335 Bloque 2 — Los impresos de mesa se abren desde el planificador y sus rutas viejas', () => {
  test('desde /fiestas/nueva?fiestaId=... se abren las 4 tarjetas de impresos con título, imprimir y fiestaId', async ({
    context,
    page,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    await ponerSesionDelEquipo(context, baseURL);

    for (const item of IMPRESOS) {
      await page.goto(`/fiestas/nueva?fiestaId=${encodeURIComponent(fiestaId)}`, {
        waitUntil: 'domcontentloaded',
      });

      const tabComida = page.getByRole('tab', { name: 'Comida, barra e impresos' });
      await expect(tabComida).toBeVisible({ timeout: 30_000 });
      await tabComida.click();

      const cardLink = page
        .locator('a')
        .filter({ has: page.getByText(item.cardTitle, { exact: true }) })
        .first();
      await expect(cardLink).toBeVisible({ timeout: 15_000 });
      await cardLink.click();

      await expect(page).toHaveURL(new RegExp(`/fiestas/nueva/comida.*tab=${item.tab}`));
      const url = new URL(page.url());
      expect(url.pathname).toBe('/fiestas/nueva/comida');
      expect(url.searchParams.get('tab')).toBe(item.tab);
      expect(url.searchParams.get('fiestaId')).toBe(fiestaId);

      await expect(page.getByRole('heading', { name: item.heading })).toBeVisible({ timeout: 60_000 });

      if (item.printSelector.type === 'role') {
        await expect(page.getByRole('button', { name: item.printSelector.name })).toBeVisible();
      } else {
        await expect(page.getByTitle(item.printSelector.value, { exact: true })).toBeVisible();
      }
    }
  });

  test('entrar por las rutas viejas llega en un salto al panel correspondiente', async ({
    context,
    page,
    baseURL,
  }) => {
    test.setTimeout(180_000);
    await ponerSesionDelEquipo(context, baseURL);

    for (const item of IMPRESOS) {
      const oldUrl = `${item.oldPath}?fiestaId=${encodeURIComponent(fiestaId)}`;
      const res = await context.request.get(oldUrl, { maxRedirects: 0 });
      expect([307, 308]).toContain(res.status());
      const location = res.headers()['location'] || '';
      expect(new URL(location, "http://x").pathname).toBe("/fiestas/nueva/comida");
      expect(new URL(location, "http://x").searchParams.get("tab")).toBe(item.tab);
      expect(location).toContain(`fiestaId=${encodeURIComponent(fiestaId)}`);

      await page.goto(oldUrl, { waitUntil: 'domcontentloaded' });
      await expect(page).toHaveURL(new RegExp(`/fiestas/nueva/comida.*tab=${item.tab}`));
      const url = new URL(page.url());
      expect(url.pathname).toBe('/fiestas/nueva/comida');
      expect(url.searchParams.get('tab')).toBe(item.tab);
      expect(url.searchParams.get('fiestaId')).toBe(fiestaId);
      await expect(page.getByRole('heading', { name: item.heading })).toBeVisible({ timeout: 60_000 });
    }
  });
});
