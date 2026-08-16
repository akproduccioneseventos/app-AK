import { expect, test } from '@playwright/test';

test('health endpoint responds without exposing internal failures', async ({ request }) => {
  const response = await request.get('/api/health');

  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toMatchObject({
    status: 'ok',
    services: {
      firebase: expect.any(Boolean),
      gemini: expect.any(Boolean),
      googleWorkspace: expect.any(Boolean),
      mail: expect.any(Boolean),
      instagram: expect.any(Boolean),
    },
  });
});

test('protected access screen remains usable', async ({ page }) => {
  test.setTimeout(180_000);

  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Acceso Protegido', { exact: true })).toBeVisible();
  await expect(page.getByTestId('login-password')).toBeVisible();
  await expect(page.getByTestId('login-submit')).toBeEnabled();
  await expect(page.getByRole('link', { name: /Olvide mi contrase/i })).toBeVisible();
});

test('password recovery keeps the configured AK email visible when status verification is slow', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const recoveryButton = page.getByRole('link', { name: /Olvide mi contrase/i });
  await expect(recoveryButton).toHaveCount(1);
  await recoveryButton.click();

  await expect(page.getByText(/Mail de recuperaci.n: ak\*\*\*@gmail\.com/i)).toBeVisible();
  await expect(page.getByText(/Todav.a no hay mail de recuperaci.n configurado/i)).toHaveCount(0);
});

test('manual budget simulator remains publicly reachable', async ({ page }) => {
  const response = await page.goto('/simulador-de-presupuesto', {
    waitUntil: 'domcontentloaded',
  });

  expect(response?.status()).toBe(200);
  expect(page.url()).toContain('/simulador-de-presupuesto');
  await expect(page.locator('body')).toBeVisible();
});

test('simulator hub connects both options with the visual first step', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto('/simulador', { waitUntil: 'domcontentloaded' });

  const visualOption = page.getByTestId('simulator-option-visual');
  const assistantOption = page.getByTestId('simulator-option-assistant');
  await expect(visualOption).toHaveAttribute('href', /\/simulador-de-presupuesto/);
  await expect(assistantOption).toHaveAttribute('href', /\/simulador-ak/);

  await visualOption.click();
  await expect(page).toHaveURL(/\/simulador-de-presupuesto/);
  await page.getByTestId('simulator-cover-start').click();
  const firstStepCta = page.getByTestId('simulator-first-step-cta');
  await expect(firstStepCta).toBeVisible();
  await firstStepCta.click();
  await expect(page.getByRole('heading', { name: 'Ingresá tus datos y los del evento' })).toBeVisible();
});

test('public homepage fits the viewport without horizontal overflow', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

  expect(response?.status()).toBe(200);
  const mainHeading = page.getByRole('heading', { level: 1 });
  await expect(mainHeading).toHaveCount(1);
  await expect(mainHeading).toBeVisible();
  const gallery = page.getByTestId('gallery-section');
  await expect(gallery).toBeVisible();
  await expect(
    gallery.getByRole('heading', { name: 'Galería de eventos', level: 2 }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Elegimos la base y la hacemos tuya.' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('img', { name: 'Fiestas de 15 producida por AK Producciones' }),
  ).toHaveAttribute('src', /xv-pista-iluminada-01\.jpeg/);
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);

  if ((page.viewportSize()?.width ?? 1280) < 640) {
    await page.waitForTimeout(500);
    await page.evaluate(() => {
      window.scrollTo(0, 800);
      window.dispatchEvent(new Event('scroll'));
    });
    // Lo que hay que cuidar es que los accesos flotantes NO tapen la galería
    // mientras la persona mira las fotos. Se comprueban las dos formas de
    // molestar: ocupar mucho alto (la columna vieja llegaba a media pantalla) y
    // cruzar todo el ancho como una barra, que corta el pie de la pantalla.
    const anchoPantalla = page.viewportSize()?.width ?? 412;
    const altoPantalla = page.viewportSize()?.height ?? 900;
    const floatingActions = page.getByTestId('public-floating-actions');
    await expect(floatingActions).toBeVisible();
    const floatingBox = await floatingActions.boundingBox();
    expect(
      floatingBox?.height ?? 0,
      'Los accesos flotantes ocupan demasiado alto y tapan la galería',
    ).toBeLessThanOrEqual(altoPantalla * 0.2);
    expect(
      floatingBox?.width ?? 0,
      'Los accesos flotantes cruzan la pantalla como una barra en vez de quedar en la esquina',
    ).toBeLessThanOrEqual(anchoPantalla * 0.4);
  }
});

test('secondary public navigation returns to the matching homepage section', async ({ page }) => {
  await page.goto('/club-uruguay', { waitUntil: 'domcontentloaded' });

  const servicesLink = page.locator('header').getByRole('link', { name: 'Servicios', exact: true });
  if ((page.viewportSize()?.width ?? 1280) < 768) {
    await page.getByRole('button', { name: 'Abrir menú' }).click();
  }

  await expect(servicesLink).toBeVisible();
  await servicesLink.click();
  await expect(page).toHaveURL(/\/#landing-services$/);
  await expect(page.locator('#landing-services')).toBeVisible();
});

test('simulator input keeps typed text visible and the flow fits the viewport', async ({ page }) => {
  await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });
  const startButton = page.getByTestId('simulator-cover-start');
  await expect(startButton).toBeVisible();
  await startButton.click();

  const continueButton = page.getByTestId('simulator-first-step-cta');
  await expect(continueButton).toBeEnabled();
  await continueButton.click();

  const nameInput = page.locator('#simulator-name');
  await expect(nameInput).toBeVisible();
  await nameInput.fill('Ana García');
  await expect(nameInput).toHaveValue('Ana García');

  const inputInk = await nameInput.evaluate((element) => {
    const style = getComputedStyle(element);
    return { color: style.color, opacity: style.opacity, caretColor: style.caretColor };
  });
  expect(inputInk.color).not.toBe('transparent');
  expect(inputInk.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(Number(inputInk.opacity)).toBeGreaterThan(0);
  expect(inputInk.caretColor).not.toBe('transparent');
  await expect(page.getByText('Revisión comercial prioritaria')).toHaveCount(0);
  await expect(page.getByText(/^\d{2}:\d{2}$/)).toHaveCount(0);

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
});
