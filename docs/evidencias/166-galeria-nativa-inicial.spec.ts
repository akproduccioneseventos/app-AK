import { expect, test, type Page, type TestInfo } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:3300';
const AISLADO = process.env.AK_ENTORNO_AISLADO === 'true'
  && process.env.AK_USE_LOCAL_JSON_ONLY === 'true'
  && process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') === BASE_URL;
const GALERIA = '[data-testid="gallery-section"]';
const DIALOGO = '[role="dialog"][aria-label="Vista ampliada de la galería"]';
const CERRAR = 'button[aria-label="Cerrar galería"]';
const FOTOS = ['Prueba nativa galería 166 foto uno', 'Prueba nativa galería 166 foto dos'];
const SVG_QA = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="20" viewBox="0 0 32 20"><rect width="32" height="20" fill="#d71920"/></svg>';

test.use({ serviceWorkers: 'block', baseURL: BASE_URL });
test.skip(!AISLADO, 'Solo runner ficticio local: AK_ENTORNO_AISLADO, AK_USE_LOCAL_JSON_ONLY y 127.0.0.1:3300 requeridos.');

async function guardarEvidencia(page: Page, testInfo: TestInfo, observations: Record<string, unknown>) {
  observations.finalUrl = page.url();
  observations.finalFocus = await page.evaluate(() => {
    const active = document.activeElement;
    return active instanceof HTMLElement
      ? { tag: active.tagName, text: active.getAttribute('aria-label') || active.innerText?.trim().slice(0, 100) || '' }
      : null;
  }).catch((error: unknown) => ({ error: String(error) }));
  await testInfo.attach('166-observed.json', {
    contentType: 'application/json',
    body: JSON.stringify(observations, null, 2),
  });
  await testInfo.attach('166-gallery.png', {
    contentType: 'image/png',
    body: await page.screenshot({ fullPage: true }).catch(() => Buffer.from('')),
  });
}

async function preparar(page: Page, testInfo: TestInfo, observations: Record<string, unknown>) {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (route.request().resourceType() === 'image') {
      await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG_QA });
      return;
    }
    if (/^https?:$/.test(url.protocol) && !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) {
      if (route.request().resourceType() === 'image') {
        await route.fulfill({ status: 200, contentType: 'image/svg+xml', body: SVG_QA });
      } else {
        observations.blockedExternal = [...((observations.blockedExternal as string[] | undefined) || []), `${url.origin}${url.pathname}`];
        await route.abort('blockedbyclient');
      }
      return;
    }
    await route.continue();
  });

  const health = await page.request.get('/api/health');
  const body = await health.json().catch(() => ({}));
  observations.health = { status: health.status(), version: body.version, services: body.services };
  expect(health.ok(), 'health local debe responder').toBe(true);
  expect(body.version, 'health debe identificar fuente Claude108e').toMatch(/^108e/);
  expect(body.services).toBeTruthy();
  for (const [name, active] of Object.entries(body.services)) {
    expect(active, `health.services.${name} debe permanecer desactivado`).toBe(false);
  }
  await page.goto('/#landing-gallery', { waitUntil: 'domcontentloaded' });
  const section = page.locator(GALERIA);
  await expect(section).toBeVisible();
  await expect(section).not.toHaveAttribute('aria-busy', 'true');
  for (const title of FOTOS) await expect(section.getByRole('button', { name: new RegExp(title) })).toBeVisible();
  observations.galleryLoaded = true;
}

test('Pixel 7: abre tarjeta, enfoca cerrar, navega con flechas, Escape cierra y devuelve foco', async ({ page }, testInfo) => {
  testInfo.setTimeout(90_000);
  const observed: Record<string, unknown> = { source: 'Claude108e17b4387237fc921ea12e8d1eb65b20f62ac9', device: 'Pixel 7', case: 'entrada-flechas-escape-retorno' };
  try {
    await preparar(page, testInfo, observed);
    const section = page.locator(GALERIA);
    const firstCard = section.getByRole('button', { name: new RegExp(FOTOS[0]) });
    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.tap();
    const dialog = page.locator(DIALOGO);
    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('Cerrar galería');
    observed.opened = true;
    observed.autofocusClose = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    const initialPicture = await dialog.locator('img').getAttribute('src');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => dialog.locator('img').getAttribute('src')).not.toBe(initialPicture);
    observed.arrowRight = true;
    await page.keyboard.press('ArrowLeft');
    await expect(dialog.locator('img')).toHaveAttribute('src', initialPicture!);
    observed.arrowLeft = true;

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(firstCard).toBeFocused();
    observed.escapeAndReturn = true;
  } finally {
    await guardarEvidencia(page, testInfo, observed);
  }
});

test('Chromium desktop: Tab y Shift+Tab nativos permanecen dentro del visor abierto', async ({ page }, testInfo) => {
  testInfo.setTimeout(90_000);
  const observed: Record<string, unknown> = { source: 'Claude108e17b4387237fc921ea12e8d1eb65b20f62ac9', device: 'Desktop Chrome', case: 'native-tab-containment' };
  try {
    await preparar(page, testInfo, observed);
    const section = page.locator(GALERIA);
    const firstCard = section.getByRole('button', { name: new RegExp(FOTOS[0]) });
    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.click();
    const dialog = page.locator(DIALOGO);
    await expect(dialog).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('aria-label'))).toBe('Cerrar galería');

    const focusables = dialog.locator('button:visible');
    const count = await focusables.count();
    expect(count).toBeGreaterThanOrEqual(4);
    const focusState = async () => page.evaluate(() => {
      const active = document.activeElement;
      const dialogNode = document.querySelector('[role="dialog"][aria-label="Vista ampliada de la galería"]');
      return { inside: Boolean(active && dialogNode?.contains(active)), label: active?.getAttribute('aria-label') || '' };
    });

    for (let i = 0; i < count + 2; i++) {
      await page.keyboard.press('Tab');
      const state = await focusState();
      observed.tabSteps = [...((observed.tabSteps as unknown[]) || []), state];
      if (!state.inside) break;
    }
    await dialog.locator(CERRAR).focus();
    for (let i = 0; i < count + 2; i++) {
      await page.keyboard.press('Shift+Tab');
      const state = await focusState();
      observed.shiftTabSteps = [...((observed.shiftTabSteps as unknown[]) || []), state];
      if (!state.inside) break;
    }
    const forward = (observed.tabSteps as Array<{ inside: boolean }>).every(s => s.inside);
    const backward = (observed.shiftTabSteps as Array<{ inside: boolean }>).every(s => s.inside);
    observed.nativeTabContainment = forward && backward;
    expect.soft(forward, 'Tab nativo no debe sacar el foco del visor').toBe(true);
    expect.soft(backward, 'Shift+Tab nativo no debe sacar el foco del visor').toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(firstCard).toBeFocused();
  } finally {
    await guardarEvidencia(page, testInfo, observed);
  }
});
