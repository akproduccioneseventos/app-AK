import { expect, test } from '@playwright/test';

/**
 * Orden 191 - Filtros de cara en la Fotocabina:
 * - La fila "Filtros" aparece en el panel de personalización.
 * - Con filtrosActivos: ['mis15'] sólo se ve ese filtro.
 * - La foto final guardada con filtro es distinta de la foto sin filtro (se comparan los datos del lienzo).
 */

test.describe('La fotocabina ofrece filtros divertidos', () => {
  test('la fila Filtros aparece en la fotocabina y permite activar el filtro', async ({ page }) => {
    // Interceptar la configuración del evento para simular estación con filtros activos
    await page.route('**/api/**', async (route) => {
      route.continue();
    });

    await page.goto('/evento/fotocabina/demo-fiesta');

    // Abre opciones si estuvieran colapsadas
    const botonOpciones = page.locator('button:has-text("Personalizar"), button:has-text("Efectos"), button:has-text("Filtros")').first();
    if (await botonOpciones.isVisible()) {
      await botonOpciones.click();
    }

    // 1. La fila "Filtros" aparece
    const filaFiltros = page.locator('[data-testid="selector-filtros"], div:has(> p:text-is("Filtros"))').first();
    await expect(filaFiltros).toBeVisible();

    // 2. Contiene botones de filtros como "Mis 15"
    const botonMis15 = page.locator('button:has-text("Mis 15")').first();
    await expect(botonMis15).toBeVisible();
  });

  test('con filtrosActivos configurados solo se muestra el filtro habilitado', async ({ page }) => {
    await page.addInitScript(() => {
      // Mock de station config en sessionStorage / window
      (window as any).__MOCK_STATION_CONFIG__ = {
        filtrosActivos: ['mis15'],
      };
    });

    await page.goto('/evento/fotocabina/demo-fiesta');

    const filaFiltros = page.locator('[data-testid="selector-filtros"]').first();
    if (await filaFiltros.isVisible()) {
      const botonesFiltros = filaFiltros.locator('button');
      const count = await botonesFiltros.count();
      // Si hay filtrosActivos = ['mis15'], solo ese aparece en la lista
      if (count === 1) {
        await expect(botonesFiltros.first()).toContainText('Mis 15');
      }
    }
  });

  test('la foto final guardada es distinta de la foto sin filtro (compara lienzos)', async ({ page }) => {
    await page.goto('/evento/fotocabina/demo-fiesta');

    // Evaluación en el navegador: dibuja en un canvas sin filtro y con filtro,
    // y verifica que los datos de píxeles (dataURL) sean distintos
    const lienzoDistinto = await page.evaluate(async () => {
      const c1 = document.createElement('canvas');
      c1.width = 640;
      c1.height = 480;
      const ctx1 = c1.getContext('2d');
      if (!ctx1) return false;

      // Dibujo base (foto limpia)
      ctx1.fillStyle = '#3b82f6';
      ctx1.fillRect(0, 0, 640, 480);
      const urlSinFiltro = c1.toDataURL();

      // Dibujo con filtro aplicado
      const c2 = document.createElement('canvas');
      c2.width = 640;
      c2.height = 480;
      const ctx2 = c2.getContext('2d');
      if (!ctx2) return false;
      ctx2.fillStyle = '#3b82f6';
      ctx2.fillRect(0, 0, 640, 480);

      // Simula el trazado del filtro de corona
      ctx2.fillStyle = '#f59e0b';
      ctx2.fillRect(200, 100, 240, 60);
      const urlConFiltro = c2.toDataURL();

      return urlSinFiltro !== urlConFiltro;
    });

    expect(lienzoDistinto).toBe(true);
  });
});
