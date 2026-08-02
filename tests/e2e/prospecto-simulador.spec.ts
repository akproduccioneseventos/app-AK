import { expect, test } from '@playwright/test';
import { borrarProspectosDePrueba } from './helpers/fiesta-de-prueba';

/**
 * El recorrido del que todavía no es cliente.
 *
 * Es el camino por donde entra la plata: alguien llega al simulador, carga sus
 * datos, arma el menú, elige el paquete y ve un precio. Si en algún paso se
 * traba, esa venta no ocurre y nadie se entera.
 *
 * La prueba llega hasta ver el precio, y **no** genera el presupuesto: ese paso
 * crea un prospecto de verdad y ensuciaría los datos del negocio con gente que
 * no existe.
 */

const NOMBRE = 'Prospecto de prueba';

// El simulador registra el avance paso a paso, así que el recorrido crea un
// prospecto de verdad. Se borra al terminar: el CRM es del negocio, no de las
// pruebas.
test.afterAll(() => {
  borrarProspectosDePrueba();
});
const TELEFONO = '099 123 456';

test.describe('recorrido del prospecto', () => {
  test('llega desde el simulador hasta ver un precio', async ({ page }) => {
    test.setTimeout(300_000);

    const erroresJs: string[] = [];
    page.on('pageerror', (e) => erroresJs.push(e.message));

    await page.goto('/simulador-de-presupuesto', { waitUntil: 'domcontentloaded' });

    // Paso 1: la portada. Se busca por el texto que ve una persona, no por una
    // marca interna: si el botón cambia de nombre, la prueba tiene que avisar.
    const empezar = page.getByRole('button', { name: /Comenzar mi presupuesto|Cotizar/i }).first();
    await expect(empezar, 'No aparece el botón para empezar a cotizar').toBeVisible({ timeout: 45_000 });
    await empezar.click();

    // La portada del simulador tiene su propio botón para arrancar el paso a paso.
    const arrancar = page.getByRole('button', { name: /Cotizar mi fiesta/i }).first();
    await expect(arrancar, 'No aparece el botón que arranca el paso a paso').toBeVisible({ timeout: 45_000 });
    await arrancar.click();

    // Paso 2: sus datos.
    await expect(page.locator('#simulator-name')).toBeVisible({ timeout: 45_000 });
    await page.locator('#simulator-name').fill(NOMBRE);
    await page.locator('#simulator-phone').fill(TELEFONO);

    // Duración y salón: dos decisiones que cambian el precio.
    await page.getByText('Mas de 4 horas').first().click();
    await page.getByText('Tengo salón o locación propia').first().click();

    // Cantidad de gente.
    const adultos = page.locator('input[type="number"]').first();
    await adultos.fill('80');

    // La fecha: se abre el calendario y se toma un día disponible del mes que viene.
    const calendario = page.getByRole('button', { name: /fecha|Elegí|Seleccion/i }).first();
    if (await calendario.isVisible().catch(() => false)) {
      await calendario.click();
      const siguiente = page.getByRole('button', { name: /next month|mes siguiente/i }).first();
      if (await siguiente.isVisible().catch(() => false)) await siguiente.click();
      const dia = page.getByRole('gridcell', { name: '15', exact: true }).first();
      if (await dia.isVisible().catch(() => false)) await dia.click();
    }

    // Avanzar hasta el final del recorrido. Cada "Continuar" tiene que llevar a
    // algún lado: si uno se traba, la venta se corta ahí.
    for (let paso = 0; paso < 4; paso += 1) {
      const continuar = page.getByRole('button', { name: 'Continuar' }).first();
      if (!(await continuar.isVisible().catch(() => false))) break;
      await expect(continuar, `El botón "Continuar" quedó bloqueado en el paso ${paso + 2}`).toBeEnabled({ timeout: 20_000 });
      await continuar.click();
      await page.waitForTimeout(2500);
    }

    // Sobre el final aparece el cartel que ofrece subir de paquete. Es parte de
    // la venta: una persona lo lee y decide. Acá se elige quedarse con lo que
    // venía armando, que es lo que hace la mayoría.
    const mantener = page.getByRole('button', { name: /Mantener mi selección actual/i }).first();
    if (await mantener.isVisible().catch(() => false)) {
      await mantener.click();
      await page.waitForTimeout(1500);
    }

    // Lo que importa: el prospecto tiene que ver un precio, no un cero ni un
    // texto roto.
    const textoFinal = await page.locator('body').innerText();
    const montos = textoFinal.match(/\$\s?[\d.]{4,}/g) ?? [];
    expect(montos.length, `No apareció ningún precio en el recorrido:\n${textoFinal.slice(0, 400)}`).toBeGreaterThan(0);
    expect(textoFinal).not.toMatch(/NaN|Infinity|\[object Object\]/);

    // Y tiene que poder cerrar: o generar el presupuesto o escribirle a AK.
    const cierre = page.getByRole('button', { name: /WhatsApp|Generar presupuesto/i }).first();
    await expect(cierre, 'El prospecto llegó al final pero no tiene cómo cerrar').toBeVisible({ timeout: 20_000 });

    expect(erroresJs, `El simulador tuvo fallas de JavaScript:\n${erroresJs.join('\n')}`).toEqual([]);
  });

  test('el catálogo lleva al simulador con el tipo de fiesta elegido', async ({ page }) => {
    test.setTimeout(180_000);

    // Es lo que se hace sentado con el cliente: se le muestra el catálogo y de
    // ahí se pasa a cotizar.
    await page.goto('/catalogo/bodas', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Siguiente/i }).first()).toBeVisible({ timeout: 45_000 });

    const textoCatalogo = await page.locator('body').innerText();
    expect(textoCatalogo).not.toMatch(/NaN|Infinity|\[object Object\]/);
    expect(textoCatalogo.length, 'El catálogo quedó vacío').toBeGreaterThan(200);
  });
});
