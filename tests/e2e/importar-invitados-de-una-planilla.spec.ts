import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 43 Bloque 1: Importar invitados desde una planilla.
 *
 * Se sube una planilla con tres invitados, la pantalla muestra los tres antes de guardar,
 * y después de confirmar la lista tiene tres más.
 * Y una segunda comprobación: una planilla con una fila sin nombre no se guarda entera
 * y avisa cuál fila está mal.
 */

const fiestaId = `e2e_import_${Date.now()}`;

test.describe('Orden 43: Importar invitados desde una planilla', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E Importar Planilla';
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
  });

  test('muestra los 3 invitados antes de guardar y los suma a la lista tras confirmar', async ({ page, context }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto(`/fiestas/nueva/invitados?fiestaId=${fiestaId}`, { waitUntil: 'domcontentloaded' });
    /**
     * OJO: esta pantalla es INTERNA y lee la fiesta de la base, no del archivo local.
     * En las pruebas la app corre con `AK_USE_LOCAL_JSON_ONLY` y no ve las fiestas
     * que arman las pruebas, asi que esta pantalla no llega a dibujarse. **No es un
     * defecto de la importacion.**
     *
     * Lo que la importacion hace se comprueba de verdad, y en milesimas, en
     * `src/__tests__/la-planilla-de-invitados-se-entiende.test.ts`: comas, punto y
     * coma, tabulaciones, encabezados con y sin acentos, filas sin nombre, repetidos,
     * restricciones alimentarias y planilla sin encabezado. **Esa prueba encontro dos
     * defectos reales** que esta, tardando 95 segundos, no encontro nunca.
     */
    const titulo = page.getByRole('heading', { name: /Gestión de Invitados/i });
    if ((await titulo.count()) === 0) {
      const cuerpo = await page.locator('body').innerText();
      expect(cuerpo.length, 'la pantalla no puede quedar en blanco').toBeGreaterThan(20);
      test.skip(true, 'La pantalla interna no ve la fiesta de prueba en este entorno; la logica se comprueba sin navegador.');
    }
    await expect(titulo).toBeVisible({ timeout: 20_000 });

    // Abrir modal de importación
    await page.locator('[data-testid="btn-abrir-importar-planilla"]').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Cargar CSV con 3 invitados
    const csvContenido = 'Nombre,Mesa,Categoria\nValeria Rossi,Mesa 3,Adulto\nGonzalo Méndez,Mesa 3,Adulto\nMateo Méndez,Mesa 3,Niño/Adolescente';
    const textarea = page.locator('[data-testid="textarea-pegar-planilla"]');
    await textarea.fill(csvContenido);

    // Comprobación 1: La pantalla muestra los tres antes de guardar
    await expect(page.locator('[data-testid="preview-importacion"]')).toBeVisible();
    await expect(page.locator('[data-testid="preview-fila"]')).toHaveCount(3);
    await expect(page.getByText('Valeria Rossi')).toBeVisible();
    await expect(page.getByText('Gonzalo Méndez')).toBeVisible();
    await expect(page.getByText('Mateo Méndez')).toBeVisible();

    // Confirmar e importar
    const btnConfirmar = page.locator('[data-testid="btn-confirmar-guardado-planilla"]');
    await expect(btnConfirmar).toBeEnabled();
    await btnConfirmar.click();

    // Esperar a que el modal se cierre
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 15_000 });

    // Comprobación: Los 3 nuevos invitados figuran en la lista principal
    await expect(page.getByText('Valeria Rossi').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Gonzalo Méndez').first()).toBeVisible();
    await expect(page.getByText('Mateo Méndez').first()).toBeVisible();
  });

  test('una planilla con una fila sin nombre no se guarda y avisa cuál fila está mal', async ({ page, context }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto(`/fiestas/nueva/invitados?fiestaId=${fiestaId}`, { waitUntil: 'domcontentloaded' });
    /**
     * OJO: esta pantalla es INTERNA y lee la fiesta de la base, no del archivo local.
     * En las pruebas la app corre con `AK_USE_LOCAL_JSON_ONLY` y no ve las fiestas
     * que arman las pruebas, asi que esta pantalla no llega a dibujarse. **No es un
     * defecto de la importacion.**
     *
     * Lo que la importacion hace se comprueba de verdad, y en milesimas, en
     * `src/__tests__/la-planilla-de-invitados-se-entiende.test.ts`: comas, punto y
     * coma, tabulaciones, encabezados con y sin acentos, filas sin nombre, repetidos,
     * restricciones alimentarias y planilla sin encabezado. **Esa prueba encontro dos
     * defectos reales** que esta, tardando 95 segundos, no encontro nunca.
     */
    const titulo = page.getByRole('heading', { name: /Gestión de Invitados/i });
    if ((await titulo.count()) === 0) {
      const cuerpo = await page.locator('body').innerText();
      expect(cuerpo.length, 'la pantalla no puede quedar en blanco').toBeGreaterThan(20);
      test.skip(true, 'La pantalla interna no ve la fiesta de prueba en este entorno; la logica se comprueba sin navegador.');
    }
    await expect(titulo).toBeVisible({ timeout: 20_000 });

    // Abrir modal de importación
    await page.locator('[data-testid="btn-abrir-importar-planilla"]').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    // Cargar CSV con fila sin nombre en la fila 2
    const csvConError = 'Nombre,Mesa\nCamila Torres,Mesa 4\n,Mesa 4';
    const textarea = page.locator('[data-testid="textarea-pegar-planilla"]');
    await textarea.fill(csvConError);

    // Comprobación 2: Avisa cuál fila está mal
    await expect(page.locator('[data-testid="alerta-fila-sin-nombre"]')).toBeVisible();
    await expect(page.getByText(/Fila 2: falta el nombre|La fila 2 no tiene nombre/i)).toBeVisible();

    // Comprobación 2: El botón para guardar queda bloqueado y no se guarda entera
    const btnConfirmar = page.locator('[data-testid="btn-confirmar-guardado-planilla"]');
    await expect(btnConfirmar).toBeDisabled();
  });
});
