/**
 * Las pantallas del invitado nunca quedan colgadas si se corta la señal.
 *
 * Se probó rompiéndola a propósito: quitando temporalmente el finally de
 * src/app/feedback/[fiestaId]/page.tsx, la prueba se pone en rojo porque
 * el botón queda en "Enviando..." indefinidamente y nunca vuelve a habilitarse.
 *
 * Orden 64 — Bloque 1.
 */
import { expect, test } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, guardarFiesta } from './helpers/fiesta-de-prueba';

const FIESTA_ID = `e2e_colgadas_${Date.now()}`;

test.describe('Las pantallas del invitado no quedan colgadas', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E Pantallas Invitado';
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(FIESTA_ID);
  });

  test('/feedback/<id> no queda colgada si la respuesta del servidor se corta', async ({ page }) => {
    test.setTimeout(90_000);

    // 1. Abrir la pantalla de feedback
    await page.goto(`/feedback/${FIESTA_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#client-name')).toBeVisible({ timeout: 20_000 });

    // Completar el formulario
    const nombre = 'Juan Pérez Invitado';
    const disfrute = 'La comida estuvo excelente y la música impecable';
    const mejora = 'Más postres en la mesa dulce';
    const comentarios = 'Muchas gracias por la atención';

    await page.locator('#client-name').fill(nombre);
    await page.locator('#enjoyed-most').fill(disfrute);
    await page.locator('#to-improve').fill(mejora);
    await page.locator('#general-comments').fill(comentarios);

    // 2. Cortar la respuesta del servidor en la llamada POST de la acción
    await page.route(`**/feedback/${FIESTA_ID}*`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    // 3. Apretar "Enviar Mis Comentarios"
    const submitBtn = page.getByRole('button', { name: /Enviar Mis Comentarios/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 4. El botón vuelve a decir "Enviar Mis Comentarios" (no "Enviando...")
    await expect(submitBtn).toHaveText(/Enviar Mis Comentarios/i, { timeout: 15_000 });
    await expect(submitBtn).toBeEnabled();

    // Aparece el aviso de que no se pudo enviar
    await expect(page.getByText('No se pudieron enviar tus comentarios').first()).toBeVisible({ timeout: 10_000 });

    // 5. Lo que escribió el invitado sigue en los campos: no se perdió
    await expect(page.locator('#client-name')).toHaveValue(nombre);
    await expect(page.locator('#enjoyed-most')).toHaveValue(disfrute);
    await expect(page.locator('#to-improve')).toHaveValue(mejora);
    await expect(page.locator('#general-comments')).toHaveValue(comentarios);
  });

  test('/invitacion/<id>/rsvp no queda colgada si la respuesta del servidor se corta', async ({ page }) => {
    test.setTimeout(90_000);

    // 1. Abrir la pantalla de RSVP
    await page.goto(`/invitacion/${FIESTA_ID}/rsvp`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#nombre')).toBeVisible({ timeout: 20_000 });

    // Completar los campos
    const nombre = 'Mariana Gómez';
    const contacto = '099123456';
    const mensaje = '¡Felicitaciones! Nos vemos en la fiesta';

    await page.locator('#nombre').fill(nombre);
    await page.locator('#contacto').fill(contacto);
    await page.locator('#mensaje').fill(mensaje);

    // 2. Cortar la respuesta del servidor en la llamada POST
    await page.route(`**/invitacion/${FIESTA_ID}/rsvp*`, async (route) => {
      if (route.request().method() === 'POST') {
        await route.abort('failed');
      } else {
        await route.continue();
      }
    });

    // 3. Apretar "Confirmar asistencia"
    const btnConfirmar = page.getByRole('button', { name: /Confirmar asistencia/i });
    await expect(btnConfirmar).toBeEnabled();
    await btnConfirmar.click();

    // 4. El botón vuelve a decir "Confirmar asistencia" (no "Enviando…")
    await expect(btnConfirmar).toHaveText(/Confirmar asistencia/i, { timeout: 15_000 });
    await expect(btnConfirmar).toBeEnabled();

    // Aparece el aviso de error
    await expect(page.getByText(/Error|No se pudo enviar la confirmación/i).first()).toBeVisible({ timeout: 10_000 });

    // 5. Lo que escribió el invitado sigue en los campos: no se perdió
    await expect(page.locator('#nombre')).toHaveValue(nombre);
    await expect(page.locator('#contacto')).toHaveValue(contacto);
    await expect(page.locator('#mensaje')).toHaveValue(mensaje);
  });
});
