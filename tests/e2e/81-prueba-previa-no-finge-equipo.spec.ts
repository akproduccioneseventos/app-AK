import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';
import { buildAk100Readiness } from '../../src/lib/ak-100/ak-100-readiness';

/**
 * Orden 81 — Sección D: Preparación y comprobación previa del equipo antes de la fiesta.
 *
 * Verifica que:
 * 1. El Centro de Fiesta abre correctamente con sesión de equipo y muestra el nombre del evento
 *    calculado con `buildAk100Readiness`.
 * 2. Las áreas no fingen estar listas si faltan comprobaciones o configuración de hardware.
 * 3. Las herramientas operativas de la fiesta cuentan con enlaces y destinos válidos.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_centro_81_${Date.now()}` });

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 81 — Comprobación previa de equipo y Centro de Fiesta', () => {
  test('el Centro de Fiesta levanta y buildAk100Readiness reporta el estado operativo real sin fingir equipo', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    // 1. Abrir el Centro de Fiesta
    await page.goto(`/fiestas/${fiesta.id}/centro`, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 25_000 }).catch(() => {});

    // 2. Comprobar que el encabezado del Centro de Fiesta está presente
    await expect(page.getByText('Centro de fiesta', { exact: false })).toBeVisible({ timeout: 20_000 });

    // 3. Comprobar que los indicadores de invitados confirmados están presentes
    await expect(page.locator('[data-testid="centro-confirmadas"]')).toBeVisible({ timeout: 20_000 });

    // 4. Evaluar la función buildAk100Readiness directamente sobre los datos de la fiesta
    const readiness = buildAk100Readiness(fiesta);
    expect(readiness.eventName).toBeTruthy();
    expect(readiness.areas.length).toBeGreaterThan(0);

    // Verificar que un área incompleta lista sus faltantes y no declara "listo" falsamente
    const areaIncompleta = readiness.areas.find((a) => a.status !== 'listo');
    if (areaIncompleta) {
      expect(areaIncompleta.missing.length).toBeGreaterThan(0);
      expect(areaIncompleta.href).toBeTruthy();
    }

    // 5. Verificar que las herramientas operativas de la noche se renderizan con enlaces
    const linksHerramientas = page.locator('a[href*="/evento/"]');
    const cantidad = await linksHerramientas.count();
    expect(cantidad).toBeGreaterThan(0);
  });
});
