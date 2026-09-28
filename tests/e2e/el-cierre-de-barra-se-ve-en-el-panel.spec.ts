import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, ponerSesionDelEquipo } from './helpers/fiesta-de-prueba';

/**
 * El cierre de barra (28/09/2026) aparece en el panel /fiestas/nueva/barra-tecnologica y dice
 * algo útil: la tabla de botellas para contar, o por qué no se puede cerrar todavía.
 */
const fiesta = crearFiestaDeEstaNoche({ id: `e2e_cierre_barra_${Date.now()}` });

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test('el panel de la barra muestra el cierre de barra', async ({ page, context, baseURL }) => {
  await ponerSesionDelEquipo(context, baseURL);
  await page.goto(`/fiestas/nueva/barra-tecnologica?fiestaId=${fiesta.id}`, { waitUntil: 'domcontentloaded' });

  const cierre = page.getByTestId('cierre-de-barra');
  await expect(cierre).toContainText('Cierre de barra', { timeout: 30_000 });
  // O está la tabla para contar, o el cartel que explica qué falta cargar; nunca queda cargando.
  await expect(cierre).toContainText(/Según el sistema|no tienen botellas del depósito/, { timeout: 30_000 });
});
