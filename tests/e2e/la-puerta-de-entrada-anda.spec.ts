import { test, expect } from '@playwright/test';

/**
 * LA PUERTA DE ENTRADA: NO TENIA NINGUNA PRUEBA DE NAVEGADOR.
 *
 * La pantalla por la que entra todo el equipo -y el dueno- era la unica que nadie
 * abria automaticamente. El 9 de septiembre de 2026 se reporto que mostraba "Error
 * al cargar" y no se podia entrar; recien ahi se noto que no habia control.
 *
 * Lo que se exige aca es lo minimo que no puede fallar nunca: **que el formulario se
 * pueda usar**. Da igual si el logo no carga o si la base no contesta: si no se puede
 * escribir el correo y la clave, el negocio se para.
 */
test.describe('La puerta de entrada anda', () => {
  test('el formulario de ingreso se ve y se puede escribir, entrando directo', async ({ page }) => {
    test.setTimeout(90_000);
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(String(e)));

    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // El cartel del armazon de error de Next es exactamente lo que se vio reportado.
    await expect(page.getByText(/Error al cargar/i)).toHaveCount(0);

    const correo = page.locator('input[type="email"], #email').first();
    const clave = page.locator('input[type="password"], #password').first();
    await expect(correo).toBeVisible({ timeout: 30_000 });
    await expect(clave).toBeVisible();

    await correo.fill('prueba@akproducciones.uy');
    await clave.fill('una-clave-de-prueba');
    await expect(correo).toHaveValue('prueba@akproducciones.uy');

    const entrar = page.getByRole('button', { name: /Ingresar|Entrar|Iniciar/i }).first();
    await expect(entrar).toBeVisible();
    const caja = await entrar.boundingBox();
    expect(caja?.height ?? 0).toBeGreaterThan(0);

    expect(errores, `La pantalla de ingreso tiro errores: ${errores.join(' | ')}`).toHaveLength(0);
  });

  test('llegando redirigido desde una pantalla interna, el formulario tambien se puede usar', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/login?redirect=%2Ffiestas%2Fnueva%2Fdecoracion', { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/Error al cargar/i)).toHaveCount(0);
    const correo = page.locator('input[type="email"], #email').first();
    await expect(correo).toBeVisible({ timeout: 30_000 });
    await correo.fill('prueba@akproducciones.uy');
    await expect(correo).toHaveValue('prueba@akproducciones.uy');
  });

  test('una clave equivocada avisa y NO deja entrar', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    const correo = page.locator('input[type="email"], #email').first();
    await expect(correo).toBeVisible({ timeout: 30_000 });
    await correo.fill('prueba@akproducciones.uy');
    await page.locator('input[type="password"], #password').first().fill('clave-que-no-es');
    await page.getByRole('button', { name: /Ingresar|Entrar|Iniciar/i }).first().click();

    // Se queda en la puerta: no entra a ninguna pantalla del equipo.
    await page.waitForTimeout(3_000);
    expect(page.url()).toContain('/login');
  });
});
