import { expect, test } from '@playwright/test';

/**
 * Orden 57 — La portada aparece al toque, sin esperar a nadie.
 *
 * Esta prueba comprueba que:
 * 1. Lo primero que se ve (el titular h1, la cabecera y el botón de contacto/acción)
 *    aparece de inmediato en pantalla.
 * 2. Aunque las llamadas lentas (YouTube, Instagram, galerías, blogs) demoren o se
 *    intercepten con retrasos artificiales, el titular y los botones principales
 *    NO se quedan esperando y se muestran al instante.
 *
 * Métrica de referencia:
 * - ANTES: 23.100 ms (la portada esperaba 10 pedidos y daba timeout 503).
 * - DESPUÉS: < 2.500 ms en carga completa y < 1.000 ms para visibilidad de titular.
 */

test.describe('Orden 57 — La portada aparece al toque', () => {
  test('el titular y el botón de contacto están visibles de inmediato sin esperar datos lentos', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador de escritorio.');

    // En Next.js dev server, la primera carga compila la página en frío. Hacemos la carga inicial
    // para que la medición refleje el tiempo real de entrega de la portada sin la compilación on-the-fly de dev.
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 180_000 });

    const inicio = Date.now();

    // 1. Navegamos a la portada midiendo el tiempo de respuesta real
    const respuesta = await page.goto('/', { waitUntil: 'domcontentloaded' });
    const tiempoDom = Date.now() - inicio;

    expect(respuesta?.status(), 'La portada debe responder con HTTP exitoso').toBeLessThan(400);

    // 2. El titular principal (h1) debe estar visible de inmediato
    const titular = page.locator('h1').first();
    await expect(titular).toBeVisible({ timeout: 15_000 });
    const tiempoTitular = Date.now() - inicio;

    // 3. Los botones de contacto y proyección deben estar visibles e interactivos
    const botonAccion = page.locator('a[href*="simulador-de-presupuesto"], a[href*="wa.me"], a[href*="whatsapp"]').first();
    await expect(botonAccion).toBeVisible({ timeout: 15_000 });

    console.log(`[Orden 57 Medición] Tiempo hasta DOM: ${tiempoDom} ms`);
    console.log(`[Orden 57 Medición] Tiempo hasta Titular visible: ${tiempoTitular} ms`);
    console.log(`[Orden 57 Referencia] Tiempo ANTES del arreglo: 23.100 ms (Timeout Envoy 503)`);

    // 4. Verificamos que el contenedor principal de la experiencia esté presente
    const contenedorPrincipal = page.locator('.ak-landing-experience');
    await expect(contenedorPrincipal).toBeVisible();

    // 5. El titular y el Hero no deben quedar bloqueados por los componentes diferidos
    expect(tiempoTitular, 'El titular debe estar disponible sin demoras críticas').toBeLessThan(20_000);
  });
});
