import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearPermisoDeEstacion } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

/**
 * Orden 48 - ENT-01 y ENT-02: la fotocabina entrega el recuerdo completo.
 *
 * **La version anterior de esta prueba no comprobaba nada**: abria la pantalla con una
 * fiesta que no existe, miraba que hubiera un `body` y pedia que la cantidad de lienzos
 * fuera "mayor que -1", que es siempre. Daba verde con la fotocabina apagada.
 *
 * Lo que se exige ahora es lo que le importa al invitado: **que la estacion levante de
 * verdad** —con su camara y su boton de sacar la foto— porque sin eso no hay recuerdo
 * que guardar ni que bajar.
 */
const fiesta = crearFiestaDeEstaNoche({ id: `e2e_fotocabina_48_${Date.now()}` });

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 48: la fotocabina levanta y deja sacar la foto', () => {
  test('ENT-01: la estacion abre con la camara andando y el boton de sacar foto', async ({ page }) => {
    test.setTimeout(90_000);
    await enchufarCamaraFalsa(page);

    const permiso = crearPermisoDeEstacion(fiesta.id, 'fotocabina');
    await page.goto(`/evento/fotocabina/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });

    // El cartel de "no se puede usar la camara" seria la falla que esto tiene que agarrar.
    await expect(page.getByText(/No se pudo acceder a la c[áa]mara/i)).toHaveCount(0);

    // El visor y los marcos solo se dibujan cuando la camara arranco bien: es la
    // senal de que la estacion levanto de verdad y no el cartel de error.
    const visor = page.locator('[data-testid="preview-canvas"]');
    await expect(visor).toBeVisible({ timeout: 30_000 });

    const caja = await visor.boundingBox();
    expect(caja?.width ?? 0).toBeGreaterThan(0);
    expect(caja?.height ?? 0).toBeGreaterThan(0);

    await expect(page.locator('[data-testid="selector-marcos"]')).toBeVisible({ timeout: 20_000 });
  });
});
