import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

test.describe('Orden 286 — Bloque 5: Votaciones en vivo legibles', () => {
  const fiestaId = `e2e_votaciones_${Date.now()}`;

  test.beforeAll(() => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'Fiesta Prueba Votaciones';
    fiesta.eventoEnVivo = {
      fotos: [],
      solicitudesCanciones: [],
      mensajes: [],
      votaciones: [
        {
          id: 'v_1',
          pregunta: '¿Qué tanda de baile quieren ahora?',
          activa: true,
          timestamp: new Date().toISOString(),
          opciones: [
            { id: 'op_cumbia', texto: 'Cumbia y Reggaeton', votos: 12 },
            { id: 'op_rock', texto: 'Rock y Pop Clásicos', votos: 8 },
          ],
        },
      ],
      captaciones: [],
    };
    guardarFiesta(fiesta);
  });

  test.afterAll(() => {
    borrarFiesta(fiestaId);
  });

  test('en /evento/en-vivo/<fiesta>/invitados cada pestaña tiene nombre accesible y las opciones de votación se leen', async ({ page }) => {
    await page.goto(`/evento/en-vivo/${fiestaId}/invitados`);

    // Cada pestaña debe tener nombre accesible (aria-label o texto)
    const tabs = ['Fotos', 'Música', 'Mensajes', 'Votaciones', 'Sorteo'];
    for (const nombreTab of tabs) {
      const tab = page.getByRole('tab', { name: nombreTab });
      await expect(tab).toBeVisible({ timeout: 15_000 });
      const ariaLabel = await tab.getAttribute('aria-label');
      expect(ariaLabel).toBe(nombreTab);
    }

    // Ir a la pestaña Votaciones
    const tabVotaciones = page.getByRole('tab', { name: 'Votaciones' });
    await tabVotaciones.click();

    // La pregunta debe ser visible
    await expect(page.getByText('¿Qué tanda de baile quieren ahora?')).toBeVisible({ timeout: 10_000 });

    // Cada botón de opción debe tener texto legible (color de texto diferente del fondo)
    const btnOpcion1 = page.getByRole('button', { name: 'Cumbia y Reggaeton' });
    await expect(btnOpcion1).toBeVisible();

    const contraste = await btnOpcion1.evaluate((el) => {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const bg = style.backgroundColor;
      return {
        color,
        bg,
        distintos: color !== bg,
      };
    });

    expect(contraste.distintos).toBe(true);
    // Verificar que no sea texto blanco sobre fondo blanco (rgba o rgb blanco)
    expect(contraste.bg).not.toBe('rgb(255, 255, 255)');
  });
});
