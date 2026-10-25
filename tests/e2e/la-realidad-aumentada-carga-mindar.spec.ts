import { test, expect } from '@playwright/test';

/**
 * Orden 196 y Orden 222 Bloque 4:
 * En el entorno de pruebas no hay cámara ni archivo .mind, así que la prueba abre
 * /evento/ar/fiesta-sin-realidad-aumentada y comprueba:
 * - que aparece el texto 'Esta invitación todavía no tiene realidad aumentada';
 * - que 'Cargando Realidad Aumentada...' ya no está.
 */
test('la realidad aumentada sin target muestra aviso claro y no se queda cargando', async ({ page }) => {
  await page.goto('/evento/ar/fiesta-sin-realidad-aumentada');

  // Comprueba que aparece el texto de invitación sin AR
  const mensajeAviso = page.getByText('Esta invitación todavía no tiene realidad aumentada');
  await expect(mensajeAviso).toHaveCount(1, { timeout: 15000 });

  // Comprueba que el mensaje de carga ya no está
  const textoCargando = page.getByText('Cargando Realidad Aumentada...');
  await expect(textoCargando).toHaveCount(0);
});
