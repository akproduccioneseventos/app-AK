import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { ponerSesionDelEquipo, ponerSesionDeAuditor } from './helpers/fiesta-de-prueba';

test.use({ viewport: { width: 1280, height: 800 } });

const CITAS_PATHS = [
  path.join(process.cwd(), 'data', 'crm-appointments.json'),
  path.join(process.cwd(), 'src', 'data', 'crm-appointments.json'),
];

test.describe('Orden 355 - Cuarta auditoría externa del 25/11', () => {
  test('en /empleados y /eventos con respuesta retenida no muestra (0) ni 0 antes de cargar', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
    await ponerSesionDelEquipo(context, baseURL);

    // 1. /empleados con Server Actions demoradas brevemente
    let vioCargaEmpleados = false;
    await page.route('**/empleados*', async (route) => {
      const req = route.request();
      if (req.method() === 'POST' && req.headers()['next-action']) {
        vioCargaEmpleados = true;
        await new Promise((r) => setTimeout(r, 1200));
      }
      await route.continue();
    });

    await page.goto('/empleados', { waitUntil: 'domcontentloaded' });
    const tituloEmpleados = page.getByText('Listado de Empleados', { exact: false });
    await expect(tituloEmpleados).toBeVisible({ timeout: 25_000 });
    expect(await tituloEmpleados.innerText()).not.toContain('(0)');
    expect(vioCargaEmpleados).toBe(true);
    await expect(tituloEmpleados).not.toContainText('(0)');

    // 2. /eventos con Server Actions demoradas brevemente
    let vioCargaEventos = false;
    await page.route('**/eventos*', async (route) => {
      const req = route.request();
      if (req.method() === 'POST' && req.headers()['next-action']) {
        vioCargaEventos = true;
        await new Promise((r) => setTimeout(r, 1200));
      }
      await route.continue();
    });

    await page.goto('/eventos', { waitUntil: 'domcontentloaded' });
    const cardPasados = page.locator('div.shadow-md').filter({ hasText: 'Eventos Pasados' }).first();
    const cardFuturos = page.locator('div.shadow-md').filter({ hasText: 'Eventos Futuros' }).first();
    await expect(cardPasados).toBeVisible({ timeout: 25_000 });
    expect(vioCargaEventos).toBe(true);
    await expect(cardFuturos).toContainText(/\d+/, { timeout: 25_000 });
  });

  test('en /calendario una cita de ayer en Agendada muestra "Pasada — ¿se hizo?" y "Se hizo" la cierra', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
    await ponerSesionDelEquipo(context, baseURL);

    const backups = CITAS_PATHS.map((p) => ({
      path: p,
      existed: fs.existsSync(p),
      content: fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null,
    }));

    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const citaPasada = {
      id: 'cita_pasada_e2e_355',
      clienteNombre: 'Cliente Cita Pasada E2E',
      clienteContacto: '099111222',
      eventoTipo: 'Boda',
      fechaHora: ayer,
      lugar: 'A coordinar',
      estado: 'Agendada',
      creadoEn: ayer,
    };

    try {
      for (const b of backups) {
        fs.mkdirSync(path.dirname(b.path), { recursive: true });
        const lista = b.content ? JSON.parse(b.content) : [];
        const actualizada = Array.isArray(lista)
          ? [...lista.filter((c: { id?: string }) => c?.id !== citaPasada.id), citaPasada]
          : [citaPasada];
        fs.writeFileSync(b.path, JSON.stringify(actualizada, null, 2), 'utf8');
      }

      await page.goto('/calendario', { waitUntil: 'domcontentloaded' });
      const card = page.locator('div.rounded-2xl').filter({ hasText: 'Cliente Cita Pasada E2E' }).first();
      await expect(card).toBeVisible({ timeout: 25_000 });
      await expect(card).toContainText('Pasada — ¿se hizo?');

      const seHizoBtn = card.getByRole('button', { name: 'Se hizo', exact: true });
      await seHizoBtn.scrollIntoViewIfNeeded();
      await seHizoBtn.click();
      await expect(card).toContainText('Realizada', { timeout: 25_000 });
      await expect(card).not.toContainText('Pasada — ¿se hizo?');
    } finally {
      for (const b of backups) {
        if (b.existed && b.content !== null) {
          fs.writeFileSync(b.path, b.content, 'utf8');
        } else if (fs.existsSync(b.path)) {
          fs.unlinkSync(b.path);
        }
      }
    }
  });

  test('en /perfil con sesión de auditor muestra su rol y no dice "contraseña compartida"', async ({ page, context }, testInfo) => {
    const baseURL = (testInfo.project.use.baseURL as string) || 'http://127.0.0.1:3100';
    await ponerSesionDeAuditor(context, baseURL);

    await page.goto('/perfil', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Rol:', { exact: false })).toBeVisible({ timeout: 20_000 });
    const texto = await page.locator('body').innerText();
    expect(texto).toContain('Auditor');
    expect(texto).not.toContain('contraseña compartida');
  });

  test('en /presentacion-led los puntitos de navegación tienen nombre accesible', async ({ page }) => {
    await page.goto('/presentacion-led', { waitUntil: 'domcontentloaded' });
    const dots = page.locator('button[aria-label^="Ir a la diapositiva"]');
    await expect(dots.first()).toBeVisible({ timeout: 20_000 });
    const total = await dots.count();
    expect(total).toBeGreaterThan(2);
    for (let i = 0; i < total; i++) {
      const label = await dots.nth(i).getAttribute('aria-label');
      expect(label).toBeTruthy();
    }
  });
});
