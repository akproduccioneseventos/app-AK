import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';

/**
 * Orden 81 — Sección D: Comprobación interactiva del equipo antes de la fiesta.
 *
 * Flujo de usuario real:
 * 1. El operador abre el Centro de Fiesta (`/fiestas/[id]/centro`).
 * 2. Visualiza el módulo interactivo de comprobación de hardware con sus 5 pasos:
 *    cámara y micrófono, pantalla, conexión real, almacenamiento local y captura.
 * 3. Comprueba que el estado inicial en pantalla indica claramente "no probado".
 * 4. Toca el botón "Probar de nuevo" en cada paso.
 * 5. La interfaz ejecuta la verificación real en el navegador y actualiza el estado
 *    a "pasó" (o "requiere equipo") junto a la fecha y hora de la comprobación.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_previa_equipo_81_${Date.now()}` });

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 81 — Comprobación interactiva previa de equipo en Centro de Fiesta', () => {
  test('muestra los 5 pasos de hardware, permite Probar de nuevo y refleja estado con fecha/hora', async ({ page, context }, testInfo) => {
    test.setTimeout(180_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);

    // 1. Abrir el Centro de Fiesta
    await page.goto(`/fiestas/${fiesta.id}/centro`, { waitUntil: 'domcontentloaded' });

    // 2. Comprobar en pantalla que cada área incompleta dice qué le falta (sin if)
    const seccionPreparacion = page.locator('[data-testid="seccion-preparacion-ak100"]');
    await expect(seccionPreparacion).toBeVisible({ timeout: 45_000 });
    const areaTecnologia = page.locator('[data-testid="readiness-area-tecnologia"]');
    await expect(areaTecnologia).toBeVisible();
    const faltantesVisibles = page.locator('[data-testid="readiness-missing-item"]');
    await expect(faltantesVisibles.first()).toBeVisible({ timeout: 15_000 });
    expect(await faltantesVisibles.count()).toBeGreaterThanOrEqual(1);

    // 3. Comprobar que el módulo de comprobación de equipo está visible
    const seccionEquipo = page.locator('[data-testid="comprobacion-equipo"]');
    await expect(seccionEquipo).toBeVisible({ timeout: 25_000 });
    await expect(seccionEquipo.getByText('Prueba del equipo antes de la fiesta')).toBeVisible();

    // 4. Verificar la presencia de los 5 pasos con estado inicial 'no probado' y botón 'Probar de nuevo'
    const pasos = ['camara', 'pantalla', 'conexion', 'almacenamiento', 'captura'];
    for (const pasoId of pasos) {
      const pasoLoc = page.locator(`[data-testid="paso-${pasoId}"]`);
      await expect(pasoLoc).toBeVisible();
      // Estado inicial visible: "no probado"
      await expect(pasoLoc.locator('[data-testid="estado-paso"]')).toContainText('no probado');
      // Botón "Probar de nuevo" visible
      await expect(pasoLoc.getByRole('button', { name: /probar de nuevo/i })).toBeVisible();
    }

    // 4. Probar paso Pantalla: tocar "Probar de nuevo"
    const pasoPantalla = page.locator('[data-testid="paso-pantalla"]');
    await pasoPantalla.getByRole('button', { name: /probar de nuevo/i }).click();
    await expect(pasoPantalla.locator('[data-testid="estado-paso"]')).toContainText('pasó', { timeout: 30_000 });
    await expect(pasoPantalla.locator('[data-testid="fecha-hora-paso"]')).toBeVisible();

    // 5. Probar paso Almacenamiento local (IndexedDB): tocar "Probar de nuevo"
    const pasoStorage = page.locator('[data-testid="paso-almacenamiento"]');
    await pasoStorage.getByRole('button', { name: /probar de nuevo/i }).click();
    await expect(pasoStorage.locator('[data-testid="estado-paso"]')).toContainText('pasó', { timeout: 30_000 });
    await expect(pasoStorage.locator('[data-testid="fecha-hora-paso"]')).toBeVisible();

    // 6. Probar paso Captura de prueba: tocar "Probar de nuevo"
    const pasoCaptura = page.locator('[data-testid="paso-captura"]');
    await pasoCaptura.getByRole('button', { name: /probar de nuevo/i }).click();
    await expect(pasoCaptura.locator('[data-testid="estado-paso"]')).toContainText('pasó', { timeout: 30_000 });
    await expect(pasoCaptura.locator('[data-testid="fecha-hora-paso"]')).toBeVisible();

    // 7. Probar paso Conexión real: tocar "Probar de nuevo"
    const pasoConexion = page.locator('[data-testid="paso-conexion"]');
    await pasoConexion.getByRole('button', { name: /probar de nuevo/i }).click();
    await expect(pasoConexion.locator('[data-testid="estado-paso"]')).toContainText('pasó', { timeout: 30_000 });
    await expect(pasoConexion.locator('[data-testid="fecha-hora-paso"]')).toBeVisible();
  });
});
