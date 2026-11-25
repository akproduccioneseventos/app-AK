import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  crearFiestaDeEstaNoche,
  crearPermisoDeEstacion,
  guardarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

let fiestaId = '';
let codigoFiesta = '';
let telefonoInvitado = '';
let nombreInvitado = '';

test.beforeAll(() => {
  const sufijo = String(Math.floor(100000 + Math.random() * 900000));
  telefonoInvitado = `099${sufijo}`;
  codigoFiesta = 'K7P4QX';

  const fiesta = crearFiestaDeEstaNoche({ id: `e2e_331_332_${Date.now()}_${sufijo}` });
  fiesta.codigoFiesta = codigoFiesta;
  // La fábrica de fiestas de prueba la marca 'Demo AK', y desde la orden 338 una fiesta de muestra no recibe invitados.
  fiesta.estado = 'Confirmada';
  if (fiesta.guestPortalSettings) {
    fiesta.guestPortalSettings.welcomeMessage = '';
  }
  if (fiesta.invitados && fiesta.invitados[0]) {
    fiesta.invitados[0].contacto = telefonoInvitado;
    nombreInvitado = fiesta.invitados[0].nombre;
  }
  guardarFiesta(fiesta);
  fiestaId = fiesta.id;
});

test.afterAll(() => {
  if (fiestaId) borrarFiesta(fiestaId);
});

test.describe('Orden 331 — Un solo simulador, planificador agrupado y puerta de estaciones', () => {
  test('redirige /simulador manteniendo flujo normal y muestra enlace discreto a Sofía al pie', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/simulador', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/simulador-de-presupuesto(\?|$)/);

    const btnComenzar = page.getByTestId('simulator-cover-start');
    await expect(btnComenzar).toBeVisible();
    await expect(btnComenzar).toBeEnabled({ timeout: 90_000 });

    await btnComenzar.click();
    await expect(page.getByText(/Armá tu presupuesto/i).first()).toBeVisible();
    await expect(page.getByText(/Paso 1 de 4/i)).toBeVisible();
    await expect(page.locator('#simulator-name')).toBeVisible();

    const enlaceSofia = page.locator('a[href^="/simulador-ak"]').first();
    await expect(enlaceSofia).toBeVisible();
  });

  test('mantiene /simulador-ak?source=x sin redirigir conservando source=x', async ({ page }) => {
    await page.goto('/simulador-ak?source=x', { waitUntil: 'domcontentloaded' });
    const url = new URL(page.url());
    expect(url.pathname).toBe('/simulador-ak');
    expect(url.searchParams.get('source')).toBe('x');
    await expect(page.locator('body')).toBeVisible();
  });

  test('con sesión del equipo redirige rutas viejas del planificador a sus grupos con tab', async ({ context, page, baseURL }) => {
    test.setTimeout(180_000);
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto(`/fiestas/nueva/catering?fiestaId=${encodeURIComponent(fiestaId)}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/\/fiestas\/nueva\/comida/);
    const urlComida = new URL(page.url());
    expect(urlComida.pathname).toBe('/fiestas/nueva/comida');
    expect(urlComida.searchParams.get('tab')).toBe('catering');
    expect(urlComida.searchParams.get('fiestaId')).toBe(fiestaId);
    await expect(page.getByRole('heading', { name: 'Comida, barra e impresos' })).toBeVisible();

    await page.goto(`/fiestas/nueva/plan-pagos?fiestaId=${encodeURIComponent(fiestaId)}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page).toHaveURL(/\/fiestas\/nueva\/plata-y-papeles/);
    const urlPlata = new URL(page.url());
    expect(urlPlata.pathname).toBe('/fiestas/nueva/plata-y-papeles');
    expect(urlPlata.searchParams.get('tab')).toBe('plan-pagos');
    expect(urlPlata.searchParams.get('fiestaId')).toBe(fiestaId);
    await expect(page.getByRole('heading', { name: 'Plata y papeles' })).toBeVisible();
  });

  test('redirige /evento/fotocabina a /evento/inicio?rol=fotocabina y mantiene directo /evento/fotocabina/<id>', async ({ context, page, baseURL }) => {
    test.setTimeout(180_000);
    await ponerSesionDelEquipo(context, baseURL);

    await page.goto('/evento/fotocabina', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/evento\/inicio\?rol=fotocabina/);
    const urlInicio = new URL(page.url());
    expect(urlInicio.pathname).toBe('/evento/inicio');
    expect(urlInicio.searchParams.get('rol')).toBe('fotocabina');

    await context.clearCookies();
    const permiso = crearPermisoDeEstacion(fiestaId, 'fotocabina');
    await page.goto(
      `/evento/fotocabina/${encodeURIComponent(fiestaId)}?access=${encodeURIComponent(permiso)}`,
      { waitUntil: 'domcontentloaded' },
    );
    await expect(page).toHaveURL(new RegExp(`/evento/fotocabina/${fiestaId}`));
    expect(new URL(page.url()).pathname).toBe(`/evento/fotocabina/${fiestaId}`);
    if (await page.getByText(/demoro demasiado/i).isVisible().catch(() => false)) {
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
    await expect(page.getByRole('heading', { name: /Fotocabina AK/i })).toBeVisible();
  });
});

test.describe('Orden 332 — Puerta fácil en /entrar, /login y codigoFiesta visible', () => {
  test('/entrar sin sesión muestra primero Quiero organizar mi fiesta y navega al simulador con UTM', async ({ page }) => {
    await page.goto('/entrar', { waitUntil: 'domcontentloaded' });

    const btnOrganizar = page.getByTestId('btn-quiero-organizar');
    const btnInvitado = page.getByTestId('btn-soy-invitado');
    await expect(btnOrganizar).toBeVisible();
    await expect(btnOrganizar).toContainText('Quiero organizar mi fiesta');
    await expect(page.locator('main > div').first()).toContainText('Quiero organizar mi fiesta');

    const boxOrganizar = await btnOrganizar.boundingBox();
    const boxInvitado = await btnInvitado.boundingBox();
    expect(boxOrganizar).not.toBeNull();
    expect(boxInvitado).not.toBeNull();
    expect(boxOrganizar!.y).toBeLessThan(boxInvitado!.y);

    await btnOrganizar.click();
    await expect(page).toHaveURL(/\/simulador-de-presupuesto\?utm_source=app&utm_medium=entrar/);
  });

  test('/entrar como invitado con celular lleva a /evento/hub/<id> mostrando su nombre', async ({ page }) => {
    await page.goto('/entrar', { waitUntil: 'load' });

    await expect(async () => {
      await page.getByTestId('btn-soy-invitado').click();
      await expect(page.locator('#telefono-invitado')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30_000 });

    await page.locator('#telefono-invitado').fill(telefonoInvitado);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`/evento/hub/${fiestaId}`));
    await expect(page.getByText(new RegExp(nombreInvitado))).toBeVisible();
  });

  test('/login?con=google muestra Google arriba y pliega correo/clave; /login lo muestra abierto', async ({ page }) => {
    await page.goto('/login?con=google', { waitUntil: 'load' });

    const btnGoogle = page.getByTestId('login-google-primary');
    const toggleCorreo = page.getByTestId('toggle-correo-clave');
    await expect(btnGoogle).toBeVisible();
    await expect(btnGoogle).toContainText('Ingresar con Google');
    await expect(toggleCorreo).toBeVisible();
    await expect(toggleCorreo).toContainText('Entrar con correo y clave');
    await expect(page.getByTestId('login-email')).toHaveCount(0);
    await expect(page.getByTestId('login-password')).toHaveCount(0);

    await expect(async () => {
      if ((await page.getByTestId('login-email').count()) === 0) {
        await toggleCorreo.click();
      }
      await expect(page.getByTestId('login-email')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30_000 });
    await expect(page.getByTestId('login-password')).toBeVisible();

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
    await expect(page.getByTestId('login-submit')).toBeVisible();
    await expect(page.getByTestId('toggle-correo-clave')).toHaveCount(0);
  });

  test('la invitación pública y el afiche muestran el codigoFiesta de la fiesta', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto(`/invitacion/${encodeURIComponent(fiestaId)}`, { waitUntil: 'domcontentloaded' });
    const bloqueCodigoInvitacion = page.getByTestId('invitacion-codigo-fiesta');
    await expect(bloqueCodigoInvitacion).toBeVisible();
    await expect(bloqueCodigoInvitacion).toContainText(codigoFiesta);

    await page.goto(`/evento/muro-en-vivo/${encodeURIComponent(fiestaId)}/afiche`, {
      waitUntil: 'load',
    });
    const bloqueCodigoAfiche = page.getByTestId('afiche-codigo-fiesta');
    await expect(bloqueCodigoAfiche).toBeVisible();
    await expect(bloqueCodigoAfiche).toContainText(codigoFiesta);
  });
});
