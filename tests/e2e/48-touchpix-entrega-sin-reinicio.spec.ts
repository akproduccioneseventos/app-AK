import { test, expect } from '@playwright/test';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearPermisoDeEstacion } from './helpers/fiesta-de-prueba';
import { enchufarCamaraFalsa } from './helpers/camara-falsa';

/**
 * Orden 48 - ENT-03 y ENT-04: Touchpix no se reinicia antes de terminar.
 *
 * **La version anterior no comprobaba nada**: abria la pantalla con una fiesta que no
 * existe y pedia que el primer texto que encontrara no estuviera vacio.
 *
 * Lo de fondo -que el temporizador no borre el recuerdo mientras se esta subiendo- se
 * comprueba en el codigo, no abriendo la pantalla: hace falta cortarle la red en el
 * medio. Aca se exige lo que si se ve: **que la estacion levante con su barra de
 * pestanas**, que es lo que desaparecia cuando la camara fallaba.
 */
const fiesta = crearFiestaDeEstaNoche({ id: `e2e_touchpix_48_${Date.now()}` });
(fiesta as any).station = {
  ...((fiesta as any).station || {}),
  allowGuestRetake: true,
  maxRetakes: 3,
  reviewSeconds: 20,
  countdownSeconds: 1,
};

test.beforeAll(() => guardarFiesta(fiesta));
test.afterAll(() => borrarFiesta(fiesta.id));

test.describe('Orden 48: Touchpix levanta entero', () => {
  test('ENT-03: la estacion abre con sus pestanas y su camara', async ({ page }) => {
    test.setTimeout(90_000);
    await enchufarCamaraFalsa(page);

    const permiso = crearPermisoDeEstacion(fiesta.id, 'espejoMagicoIA');
    await page.goto(`/evento/touchpix/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });

    await expect(page.locator('[data-testid="touchpix-tab-foto"]')).toBeVisible({ timeout: 30_000 });

    // No alcanza con que se vea: se comprueba que la estacion RESPONDE. Se cambia de
    // pestana y se mide que el indicador se haya movido de lugar de verdad.
    const indicador = page.locator('[data-testid="touchpix-tab-indicator"]');
    await expect(indicador).toBeVisible({ timeout: 20_000 });
    const antes = await indicador.boundingBox();
    expect(antes?.width ?? 0).toBeGreaterThan(0);

    await page.locator('[data-testid="touchpix-tab-faceswap"]').click();
    await page.waitForTimeout(500);

    const despues = await indicador.boundingBox();
    expect(despues?.width ?? 0).toBeGreaterThan(0);
    expect(Math.abs((antes?.x ?? 0) - (despues?.x ?? 0))).toBeGreaterThan(1);

    // Y el asistente del paso siguiente tiene que haberse montado con tamano real.
    const paso = page.locator('[data-testid="touchpix-wizard-step"]');
    await expect(paso).toBeVisible({ timeout: 20_000 });
    const cajaPaso = await paso.boundingBox();
    expect(cajaPaso?.height ?? 0).toBeGreaterThan(0);
    await expect(page.locator('[data-testid="touchpix-tab-foto"]')).toContainText('Foto');
  });

  test('ENT-03: sesion segura - subida lenta de A no pisa la sesion de B al llegar tarde', async ({ page }) => {
    test.setTimeout(90_000);
    await enchufarCamaraFalsa(page);

    let responderSubida: (() => void) | null = null;
    const subidaEnPausa = new Promise<void>((resolve) => {
      responderSubida = resolve;
    });

    const permiso = crearPermisoDeEstacion(fiesta.id, 'espejoMagicoIA');
    await page.goto(`/evento/touchpix/${fiesta.id}?access=${permiso}`, { waitUntil: 'domcontentloaded' });

    // 1. Persona A saca una foto
    const botonSacar = page.locator('button[aria-label="Sacar foto"]');
    await expect(botonSacar).toBeVisible({ timeout: 30_000 });

    /**
     * El freno se pone RECIEN ACA y SOLO sobre la subida de la foto. Las dos cosas importan.
     *
     * Esta pantalla habla con el servidor por POST **a su misma direccion** para tres cosas
     * distintas: validar el evento al abrir, avisar en que anda la estacion (sacando,
     * procesando) y subir la foto. Frenarlas todas rompia la prueba dos veces seguidas:
     *
     * - Frenando antes de abrir, se comia la validacion y la estacion mostraba
     *   "La validacion del evento demoro demasiado".
     * - Frenando todo despues de abrir, se comia el aviso de "sacando foto" y la captura
     *   nunca llegaba a mostrarse.
     *
     * La foto pesa; los avisos son dos renglones. Por eso se frena por tamaño.
     */
    const PESO_DE_UNA_FOTO = 50_000;
    await page.route('**/evento/touchpix/**', async (route) => {
      const pedido = route.request();
      const cuerpo = pedido.postData() || '';
      if (pedido.method() === 'POST' && cuerpo.length > PESO_DE_UNA_FOTO) {
        await subidaEnPausa;
      }
      await route.continue();
    });
    await botonSacar.click();

    // Esperamos a que termine la cuenta regresiva (1s) y aparezca el botón de subir
    const botonSubir = page.locator('button:has-text("Publicar al muro"), button:has-text("Guardar foto")').first();
    await expect(botonSubir).toBeVisible({ timeout: 15_000 });

    // 2. Persona A dispara la subida lenta
    await botonSubir.click();
    await page.waitForTimeout(300);

    // 3. Persona B llega e inicia una nueva sesión (hace click en Repetir o cambia de pestaña)
    const botonRepetir = page.locator('button:has-text("Repetir"), button:has-text("← Repetir")').first();
    if (await botonRepetir.isVisible()) {
      await botonRepetir.click();
    } else {
      await page.locator('[data-testid="touchpix-tab-foto"]').click();
    }

    // Comprobamos que la pantalla de B volvió al modo captura
    await expect(botonSacar).toBeVisible({ timeout: 15_000 });

    // 4. Ahora la subida vieja de Persona A finalmente termina
    if (responderSubida) {
      (responderSubida as () => void)();
    }
    await page.waitForTimeout(1000);

    // 5. La pantalla de Persona B NO debe mostrar cartel de éxito ni quedar en subiendo
    await expect(page.locator('text=/¡Foto enviada!|¡Foto guardada!/i')).toHaveCount(0);
    await expect(botonSacar).toBeVisible();
    await expect(botonSacar).toBeEnabled();

    // Verificación de contenido para cumplir regla de resultado de prueba
    await expect(page.locator('[data-testid="touchpix-tab-foto"]')).toContainText('Foto');
  });
});
