import { test, expect } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
} from './helpers/fiesta-de-prueba';
import { createPortalSession } from '../../src/lib/security/portal-session';

/**
 * Orden 250 - Bloque 3: Así va a quedar tu fiesta
 *
 * Simula fiesta con elementos 3D y sesión de portal:
 * 1. En el portal del cliente aparece el botón "Así va a quedar tu fiesta" junto al 3D.
 * 2. Al tocarlo, se ve "Armando tu foto…" y después la imagen con "Descargar".
 * 3. Con 3 usadas, aparece el cartel "Ya armaste tus 3 fotos. Si querés otra, pedísela al equipo.".
 */

let ID_NUEVA = '';
let CLAVE_PORTAL_NUEVA = '';

let ID_TOPE = '';
let CLAVE_PORTAL_TOPE = '';

const FOTO_GENERADA_URL = '/media/salones/default.jpg';

test.describe('Orden 250 - Bloque 3: Así va a quedar tu fiesta', () => {
  test.beforeAll(({}, workerInfo) => {
    const suffix = (workerInfo?.project?.name || 'desktop').replace(/[^a-zA-Z0-9]/g, '_');
    ID_NUEVA = `e2e_asi_va_nueva_${suffix}_${Date.now()}`;
    CLAVE_PORTAL_NUEVA = `clave-asi-va-nueva-${suffix}-${Date.now()}`;

    ID_TOPE = `e2e_asi_va_tope_${suffix}_${Date.now()}`;
    CLAVE_PORTAL_TOPE = `clave-asi-va-tope-${suffix}-${Date.now()}`;

    // Fiesta sin fotos previas (0 usadas)
    const fiestaNueva = crearFiestaDeEstaNoche({
      id: ID_NUEVA,
      clavePortal: CLAVE_PORTAL_NUEVA,
    });
    fiestaNueva.configuracion = {
      ...fiestaNueva.configuracion,
      nombreEvento: 'Boda E2E Así Va A Quedar',
    };
    if (fiestaNueva.clientPortalSettings) {
      fiestaNueva.clientPortalSettings.enabled = true;
      fiestaNueva.clientPortalSettings.accessKey = CLAVE_PORTAL_NUEVA;
    }
    fiestaNueva.decoracion = {
      ...fiestaNueva.decoracion,
      salonWidth: 20,
      salonHeight: 15,
      pixelsPerMeter: 40,
      salonPreview3dUrl: '/media/salones/default.jpg',
      salonElements: [
        {
          id: 'mesa-1',
          type: 'element',
          category: 'mesa',
          name: 'Mesa Principal',
          x: 200,
          y: 200,
          width: 80,
          height: 80,
          rotation: 0,
        },
      ],
      fotosGeneradasAi: [],
    };
    guardarFiesta(fiestaNueva);

    // Fiesta con 3 fotos previas (tope alcanzado)
    const fiestaTope = crearFiestaDeEstaNoche({
      id: ID_TOPE,
      clavePortal: CLAVE_PORTAL_TOPE,
    });
    fiestaTope.configuracion = {
      ...fiestaTope.configuracion,
      nombreEvento: 'Quince E2E Tope Fotos',
    };
    if (fiestaTope.clientPortalSettings) {
      fiestaTope.clientPortalSettings.enabled = true;
      fiestaTope.clientPortalSettings.accessKey = CLAVE_PORTAL_TOPE;
    }
    fiestaTope.decoracion = {
      ...fiestaTope.decoracion,
      salonWidth: 20,
      salonHeight: 15,
      pixelsPerMeter: 40,
      salonPreview3dUrl: '/media/salones/default.jpg',
      salonElements: [
        {
          id: 'mesa-2',
          type: 'element',
          category: 'mesa',
          name: 'Mesa Invitados',
          x: 200,
          y: 200,
          width: 80,
          height: 80,
          rotation: 0,
        },
      ],
      fotosGeneradasAi: [
        '/media/salones/default.jpg',
        '/media/salones/default.jpg',
        '/media/salones/default.jpg',
      ],
    };
    guardarFiesta(fiestaTope);
  });

  test.afterAll(() => {
    if (ID_NUEVA) borrarFiesta(ID_NUEVA);
    if (ID_TOPE) borrarFiesta(ID_TOPE);
  });

  test('aparece el botón "Así va a quedar tu fiesta", muestra "Armando tu foto…" y después la imagen con "Descargar"', async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;

    await context.addCookies([
      {
        name: 'ak_portal_session',
        value: createPortalSession(ID_NUEVA, CLAVE_PORTAL_NUEVA),
        url: baseURL,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    let responderPeticion: () => void = () => {};
    const bloqueoGeneracion = new Promise<void>((resolve) => {
      responderPeticion = resolve;
    });

    let interceptarGeneracion = false;
    await page.route('**/*', async (route) => {
      const req = route.request();
      if (interceptarGeneracion && req.method() === 'POST' && req.headers()['next-action']) {
        await bloqueoGeneracion;
        const respuestaSimulada = {
          success: true,
          imageUrl: FOTO_GENERADA_URL,
        };
        await route.fulfill({
          status: 200,
          headers: {
            'content-type': 'text/x-component',
          },
          body: `0:{"a":"$@1","f":""}\n1:${JSON.stringify(respuestaSimulada)}\n`,
        });
        return;
      }
      await route.continue();
    });

    await page.goto(`/portal/${ID_NUEVA}/decoracion`, { waitUntil: 'domcontentloaded' });

    // 1. En el portal del cliente aparece el botón "Así va a quedar tu fiesta" junto al 3D
    const boton = page.getByRole('button', { name: /Así va a quedar tu fiesta/i });
    await expect(boton).toBeVisible({ timeout: 20_000 });
    await expect(boton).toBeEnabled();

    // 2. Al tocarlo, se ve "Armando tu foto…" y queda desactivado mientras procesa
    interceptarGeneracion = true;
    await boton.click();
    const botonCargando = page.getByRole('button', { name: /Armando tu foto…/i });
    await expect(botonCargando).toBeVisible({ timeout: 10_000 });
    await expect(botonCargando).toBeDisabled();

    // Liberamos la respuesta simulada
    responderPeticion();

    // 3. Después de recibir la imagen, se muestra con botón "Descargar"
    const botonDescargar = page.getByRole('link', { name: /Descargar/i });
    await expect(botonDescargar).toBeVisible({ timeout: 20_000 });
    await expect(botonDescargar).toHaveAttribute('href', FOTO_GENERADA_URL);

    // También verificamos botón "Compartir por WhatsApp" y contador restante
    const botonWhatsapp = page.getByRole('link', { name: /Compartir por WhatsApp/i });
    await expect(botonWhatsapp).toBeVisible();
    await expect(page.getByText('Te quedan 2 de 3')).toBeVisible();
  });

  test('con 3 fotos usadas, aparece el cartel exacto y el botón queda desactivado', async ({
    page,
    context,
  }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;

    await context.addCookies([
      {
        name: 'ak_portal_session',
        value: createPortalSession(ID_TOPE, CLAVE_PORTAL_TOPE),
        url: baseURL,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto(`/portal/${ID_TOPE}/decoracion`, { waitUntil: 'domcontentloaded' });

    // Cartel exacto cuando ya se usaron las 3 fotos
    const cartel = page.getByText('Ya armaste tus 3 fotos. Si querés otra, pedísela al equipo.');
    await expect(cartel).toBeVisible({ timeout: 20_000 });

    // Botón visible pero desactivado
    const boton = page.getByRole('button', { name: /Así va a quedar tu fiesta/i });
    await expect(boton).toBeVisible({ timeout: 20_000 });
    await expect(boton).toBeDisabled();
  });
});
