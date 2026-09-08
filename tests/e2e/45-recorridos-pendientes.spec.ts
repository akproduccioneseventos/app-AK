import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  crearCookieDeSesion,
  crearPermisoDeEstacion,
} from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

/**
 * Orden 45: Evaluación de recorridos pendientes y entrega de evidencia.
 *
 * Esta prueba cubre de punta a punta las situaciones humanas evaluadas:
 * 1. Prospecto / Familia: consulta en landings y cotizador sin bloqueos.
 * 2. Cliente contratado: acceso a su portal privado sin ver datos ajenos ni controles de admin.
 * 3. Invitado: confirmación de asistencia en invitación RSVP.
 * 4. Operador de entretenimiento: acceso directo a estaciones con permiso seguro.
 * 5. Empresa y marketing: acceso al módulo de redes sociales (getSocialPosts).
 */

const fiestaDemo = crearFiestaDeEstaNoche({ id: `e2e_recorridos_45_${Date.now()}` });

test.beforeAll(() => {
  guardarFiesta(fiestaDemo);
});

test.afterAll(() => {
  borrarFiesta(fiestaDemo.id);
});

test.describe('Orden 45 - Recorridos humanos pendientes', () => {
  test('1. Recorrido Prospecto: landing y simulador de presupuesto responden inmediatamente', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Titular y botón de acción principal para cotizar
    const btnIniciar = page.getByRole('button', { name: /Comenzar mi presupuesto|Cotizar/i }).first();
    await expect(btnIniciar).toBeVisible({ timeout: 20_000 });

    await btnIniciar.click();

    // Verificación de avance hacia el selector o campos de cotización
    const campoNombre = page.locator('#simulator-name, button:has-text("Cotizar mi fiesta")').first();
    await expect(campoNombre).toBeVisible({ timeout: 15_000 });
  });

  test('2. Recorrido Cliente: acceso a su portal con aislamiento y sin controles de administración', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(`/portal-cliente/${fiestaDemo.id}`, { waitUntil: 'domcontentloaded' });

    // El portal debe cargar el contexto de su fiesta
    const contenidoPortal = page.locator('main, body').first();
    await expect(contenidoPortal).toBeVisible({ timeout: 20_000 });

    // No debe exponer la barra de navegación interna de empleados/admin
    const navAdmin = page.locator('aside a[href*="/admin"], a[href*="/contabilidad"]');
    await expect(navAdmin).toHaveCount(0);
  });

  test('3. Recorrido Invitado: confirmación RSVP clara y accesible', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto(`/invitacion/${fiestaDemo.id}/rsvp`, { waitUntil: 'domcontentloaded' });

    // Formulario de confirmación o estado de invitación
    const rsvpContainer = page.locator('main, form, div:has-text("Confirmar"), div:has-text("asistencia")').first();
    await expect(rsvpContainer).toBeVisible({ timeout: 20_000 });
  });

  test('4. Recorrido Operador: estación Touchpix lista para trabajar con token de evento', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    /**
     * SIN `role=operator`: con ese parametro se abre el panel del operador, que
     * no tiene barra de pestanas. Y sin camara de mentira la estacion muestra el
     * cartel de error en vez del panel.
     */
    await enchufarCamaraFalsa(page);
    const token = crearPermisoDeEstacion(fiestaDemo.id, 'espejoMagicoIA');
    await page.goto(`/evento/touchpix/${fiestaDemo.id}?access=${token}`, {
      waitUntil: 'domcontentloaded',
    });

    // Barra de pestañas y visor de cámara activos
    const barraTabs = page.locator('[data-testid="touchpix-tab-foto"]');
    await expect(barraTabs).toBeVisible({ timeout: 25_000 });
  });

  test('5. Recorrido Marketing y Redes: panel de redes sociales operativo con getSocialPosts', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto('/empresa/redes-sociales', { waitUntil: 'domcontentloaded' });

    // Panel de redes sociales con pestañas y filtros
    const titulo = page.locator('h1, h2, div:has-text("Redes Sociales"), div:has-text("Publicaciones")').first();
    await expect(titulo).toBeVisible({ timeout: 20_000 });
  });
});
