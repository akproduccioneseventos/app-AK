import { expect, test } from '@playwright/test';
import { ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

const PANTALLAS_PRINCIPALES = [
  { nombre: 'inicio', ruta: '/mi-dia' },
  { nombre: 'eventos', ruta: '/eventos' },
  { nombre: 'una fiesta', ruta: '/fiestas/nueva' },
  { nombre: 'calendario', ruta: '/calendario' },
  { nombre: 'prospectos', ruta: '/contabilidad/crm' },
  { nombre: 'presupuestos', ruta: '/presupuestos/nuevo' },
  { nombre: 'clientes', ruta: '/customers' },
  { nombre: 'pagos rápidos', ruta: '/pagos-rapidos' },
  { nombre: 'panel contable', ruta: '/empresa/contabilidad' },
  { nombre: 'ajustes', ruta: '/settings' },
];

test.describe('La app anda en el celular a 390px (Orden 283)', () => {
  test.use({
    viewport: { width: 390, height: 844 },
  });

  test.beforeAll(async ({ request }) => {
    // Pre-calienta la compilación en frío de la app para que el primer test no sufra el timeout de chunk de Webpack
    await request.get('/mi-dia', { timeout: 120_000 }).catch(() => {});
  });

  for (const { nombre, ruta } of PANTALLAS_PRINCIPALES) {
    test(`pantalla ${nombre} (${ruta}) no desborda, tiene barra con 5 iconos y un solo boton flotante`, async ({
      page,
      context,
      baseURL,
    }) => {
      test.setTimeout(180_000);
      await ponerSesionDelEquipo(context, baseURL);
      await page.goto(ruta, { waitUntil: 'domcontentloaded' });

      // 1. Barra fija abajo con sus 5 iconos
      const barra = page.getByTestId('barra-inferior-celular');
      await expect(barra).toBeVisible({ timeout: 120_000 });
      const accesos = barra.locator('a');
      await expect(accesos).toHaveCount(5);

      // 2. Sin desplazamiento de costado a 390px (scrollWidth <= clientWidth)
      const noDesborda = await page.evaluate(() => {
        const doc = document.documentElement;
        return doc.scrollWidth <= doc.clientWidth;
      });
      expect(noDesborda, `La pantalla ${nombre} (${ruta}) desborda horizontalmente`).toBe(true);

      // 3. Un solo boton flotante (el del asistente IA)
      const botonesFlotantes = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, a[role="button"]'));
        return elements.filter((el) => {
          if (
            el.closest('[data-testid="barra-inferior-celular"]') ||
            el.closest('header') ||
            el.closest('[data-app-shell-header]') ||
            el.closest('[data-testid="sidebar"]') ||
            el.closest('[role="dialog"]') ||
            el.closest('[role="alert"]')
          ) {
            return false;
          }
          const style = window.getComputedStyle(el);
          if (style.position !== 'fixed') return false;
          if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }).map(el => el.getAttribute('aria-label') || el.textContent?.trim() || 'boton-flotante');
      });

      expect(
        botonesFlotantes.length,
        `En ${nombre} se detectaron ${botonesFlotantes.length} botones flotantes: ${JSON.stringify(botonesFlotantes)}`,
      ).toBe(1);
    });
  }
});
