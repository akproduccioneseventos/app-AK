import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  ponerSesionDeAuditor,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 276: Acceso de auditor externo.
 *
 * El auditor puede mirar toda la app sin restricciones de lectura:
 * - Con sesión de auditor abre contabilidad, presupuestos y una fiesta.
 * - Ve la franja fija superior "Acceso de auditor · sólo mirar".
 * - Al tocar "Guardar" en una pantalla, aparece el cartel de sólo mirar.
 */
test.describe('Orden 276: El auditor externo recorre la app', () => {
  const fiestaId = `e2e_fiesta_auditor_${Date.now()}`;

  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'Fiesta Auditoria Externa E2E';
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
  });

  test('con sesión de auditor abre contabilidad, presupuestos y fiesta viendo la franja fija', async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(60_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDeAuditor(context, baseURL);

    // 1. Abre contabilidad y ve la franja fija
    await page.goto('/empresa/contabilidad', { waitUntil: 'domcontentloaded' });
    const franjaContabilidad = page.getByText('Acceso de auditor · sólo mirar');
    await expect(franjaContabilidad).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 20_000 });

    // 2. Abre presupuestos y ve la franja fija
    await page.goto('/presupuestos/nuevo', { waitUntil: 'domcontentloaded' });
    const franjaPresupuestos = page.getByText('Acceso de auditor · sólo mirar');
    await expect(franjaPresupuestos).toBeVisible({ timeout: 20_000 });

    // 3. Abre una fiesta y ve la franja fija junto a los botones de portal e invitado
    await page.goto(`/fiestas/${fiestaId}/centro`, { waitUntil: 'domcontentloaded' });
    const franjaFiesta = page.getByText('Acceso de auditor · sólo mirar');
    await expect(franjaFiesta).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Ver como el cliente/i })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Ver como un invitado/i })).toBeVisible({ timeout: 20_000 });
  });

  test('al tocar "Guardar" en una pantalla, aparece el cartel de sólo mirar', async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(60_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDeAuditor(context, baseURL);

    await page.goto('/customers/new', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('Acceso de auditor · sólo mirar')).toBeVisible({ timeout: 20_000 });

    // Completa un dato mínimo para poder enviar el formulario
    const inputNombre = page.locator('#customer-name');
    await expect(inputNombre).toBeVisible({ timeout: 20_000 });
    await inputNombre.fill('Cliente Intento Auditor');

    // Toca el botón Guardar
    const botonGuardar = page.getByRole('button', { name: /Guardar Cliente|Guardar/i });
    await expect(botonGuardar).toBeVisible({ timeout: 20_000 });
    await botonGuardar.click();

    // Debe saltar el cartel de sólo mirar
    const cartelSoloMirar = page.getByText('Acceso de auditor: se puede mirar todo, pero no guardar ni mandar nada.');
    await expect(cartelSoloMirar).toBeVisible({ timeout: 20_000 });
  });
});
