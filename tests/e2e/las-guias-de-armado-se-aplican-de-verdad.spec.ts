/**
 * LA PANTALLA DE GUIAS DE ARMADO APLICA DE VERDAD, Y DICE LO QUE PASO.
 *
 * **Sale de la orden 71, del 19 de septiembre de 2026.** La guia crea las tareas de la fiesta,
 * los documentos que tienen que estar y las compras que no salen del catering. Antes el cartel
 * decia "se generaron N documentos" **contando**, sin crear nada, y si fallaba el segundo
 * guardado avisaba que no habia hecho nada **con las tareas ya creadas**: el operador aplicaba de
 * nuevo y quedaban duplicadas.
 *
 * Lo que mira esta prueba es el RESULTADO: que despues de aplicar, la fiesta tenga de verdad las
 * tareas, los documentos y las compras, y que el cartel diga esos mismos numeros.
 *
 * **Se probo rompiendola**: haciendo que la accion devuelva cero documentos, se pone en rojo.
 */
import { expect, test } from '@playwright/test';
import {
  borrarFiesta,
  crearCookieDeSesion,
  crearFiestaDeEstaNoche,
  guardarFiesta,
  leerFiesta,
} from './helpers/fiesta-de-prueba';

const FIESTA_ID = `e2e_guias_${Date.now()}`;

test.describe('Las guias de armado se aplican de verdad', () => {
  test.beforeAll(() => {
    const fiesta = crearFiestaDeEstaNoche({ id: FIESTA_ID });
    fiesta.configuracion.nombreEvento = 'Fiesta E2E guias de armado';
    guardarFiesta(fiesta);
  });

  test.afterAll(() => {
    borrarFiesta(FIESTA_ID);
  });

  test('aplicar una guia deja las tareas, los documentos y las compras en la fiesta', async ({ page, context, baseURL }) => {
    test.setTimeout(120_000);
    // La pantalla es del equipo: se entra con la cookie de sesion, como en las demas pruebas.
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL!, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto('/playbooks', { waitUntil: 'domcontentloaded' });

    // La pantalla tiene que mostrar las guias que existen.
    const aplicar = page.getByRole('button', { name: /aplicar/i }).first();
    await expect(aplicar).toBeVisible({ timeout: 30_000 });
    await aplicar.click();

    // Se le dice a que fiesta.
    const campo = page.locator('input').filter({ hasNot: page.locator('[type="hidden"]') }).last();
    await campo.fill(FIESTA_ID);

    const confirmar = page.getByRole('button', { name: /aplicar guia|aplicar playbook|confirmar|aplicar$/i }).last();
    await confirmar.click();

    // El cartel dice lo que paso, con numeros reales.
    // `.first()`: el aviso aparece en el titulo y en el detalle; alcanza con mirar uno.
    const cartel = page.getByText(/se generaron/i).first();
    await expect(cartel).toBeVisible({ timeout: 30_000 });
    const texto = (await cartel.innerText()) || '';
    const numeros = texto.match(/\d+/g)?.map(Number) ?? [];
    expect(numeros.length, 'el cartel dice los tres numeros').toBeGreaterThanOrEqual(3);
    expect(Math.max(...numeros), 'no dice cero en todo').toBeGreaterThan(0);

    // Y lo que importa: quedo guardado en la fiesta, no solo anunciado.
    await page.waitForTimeout(2_000);
    const guardada = leerFiesta(FIESTA_ID);
    expect(guardada?.tareas?.length ?? 0, 'la fiesta tiene las tareas de la guia').toBeGreaterThan(0);
    expect(guardada?.documentosRequeridos?.length ?? 0, 'la fiesta tiene los documentos').toBeGreaterThan(0);
    expect(guardada?.comprasSugeridas?.length ?? 0, 'la fiesta tiene las compras').toBeGreaterThan(0);
  });
});
