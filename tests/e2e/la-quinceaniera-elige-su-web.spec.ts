import { expect, test } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
} from './helpers/fiesta-de-prueba';
import { createPortalSession } from '../../src/lib/security/portal-session';
import { defaultInvitacionDigitalData } from '../../src/lib/invitacion-digital-defaults';
import type { PropuestaDeWeb } from '../../src/types/fiesta';

/**
 * Bloque 5 de la Orden 234: "Tres versiones para que elija la quinceañera" (26/10/2026).
 *
 * Muestra las 3 versiones como vista previa de celular, una al lado de la otra (deslizables en el teléfono),
 * con un botón '¡Quiero esta!'. Al elegir, se guarda y la propuesta elegida queda seleccionada.
 */
test.describe('Orden 234 Bloque 5 — La quinceañera elige su web desde el portal', () => {
  let fiestaId: string;
  const clavePortal = 'clave-portal-e2e-quince';

  test.beforeEach(async () => {
    fiestaId = `e2e_tu_web_${Date.now()}`;
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId, clavePortal });

    const propuestas: PropuestaDeWeb[] = [
      {
        id: 'prop-clasica',
        creadaEn: new Date().toISOString(),
        paletaTipo: 'analoga',
        tono: 'clasico',
        invitacionDigital: {
          ...defaultInvitacionDigitalData,
          plantilla: 'XvClasica',
          cabecera: {
            ...defaultInvitacionDigitalData.cabecera,
            protagonista1: 'Sofía Clásica',
            subtitulo: { text: 'Mis 15 Años', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#000' } },
            paletaColores: { primary: '#ec4899', secondary: '#4a154b', accent: '#fdf2f8' },
          },
          bienvenida: {
            visible: true,
            titulo: { text: '¡Mis 15 Años!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#000' } },
            texto: { text: 'Los momentos más lindos se comparten con quienes más queremos.', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#666' } },
          },
        },
      },
      {
        id: 'prop-moderna',
        creadaEn: new Date().toISOString(),
        paletaTipo: 'contraste',
        tono: 'moderno',
        invitacionDigital: {
          ...defaultInvitacionDigitalData,
          plantilla: 'XvModerna',
          cabecera: {
            ...defaultInvitacionDigitalData.cabecera,
            protagonista1: 'Sofía Moderna',
            subtitulo: { text: '15 Fest', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#000' } },
            paletaColores: { primary: '#ec4899', secondary: '#1e293b', accent: '#f43f5e' },
          },
          bienvenida: {
            visible: true,
            titulo: { text: '¡Llegó la noche!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#000' } },
            texto: { text: 'Preparate para vivir una noche única con la mejor música.', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#666' } },
          },
        },
      },
      {
        id: 'prop-divertida',
        creadaEn: new Date().toISOString(),
        paletaTipo: 'suave',
        tono: 'divertido',
        invitacionDigital: {
          ...defaultInvitacionDigitalData,
          plantilla: 'Allegria',
          cabecera: {
            ...defaultInvitacionDigitalData.cabecera,
            protagonista1: 'Sofía Divertida',
            subtitulo: { text: '¡Modo Fiesta!', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#000' } },
            paletaColores: { primary: '#f472b6', secondary: '#334155', accent: '#fdf4ff' },
          },
          bienvenida: {
            visible: true,
            titulo: { text: '¡A romper la pista!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#000' } },
            texto: { text: '¡Se vienen mis 15 y la fiesta va a ser épica!', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#666' } },
          },
        },
      },
    ];

    fiesta.propuestasDeWeb = propuestas;
    guardarFiesta(fiesta);
  });

  test.afterEach(async () => {
    if (fiestaId) {
      borrarFiesta(fiestaId);
    }
  });

  test('muestra las 3 versiones de celular y permite elegir una con "¡Quiero esta!"', async ({ page, context, baseURL }) => {
    test.setTimeout(120_000);

    // Configurar sesión de portal
    await context.addCookies([
      {
        name: 'ak_portal_session',
        value: createPortalSession(fiestaId, clavePortal),
        url: baseURL,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);
    await page.addInitScript(
      ({ fid, key }) => {
        window.sessionStorage.setItem(`portal_auth_${fid}`, key);
      },
      { fid: fiestaId, key: clavePortal },
    );

    await page.goto(`/portal-cliente/${fiestaId}/tu-web`, { waitUntil: 'domcontentloaded' });

    // Verificar título de la sección
    await expect(page.getByRole('heading', { name: /Tu web/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Tres versiones para tu gran noche')).toBeVisible({ timeout: 15_000 });

    // Verificar las 3 opciones con sus protagonistas
    await expect(page.getByText('Sofía Clásica')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Sofía Moderna')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Sofía Divertida')).toBeVisible({ timeout: 15_000 });

    // Verificar los botones "¡Quiero esta!" (debe haber 3 botones disponibles)
    const botonesElegir = page.getByRole('button', { name: /¡Quiero esta!/i });
    await expect(botonesElegir).toHaveCount(3);

    // Tocar el botón de la segunda versión ("Sofía Moderna")
    await botonesElegir.nth(1).click();

    // Comprobar que la opción elegida muestra "¡Elegida!"
    await expect(page.getByRole('button', { name: /¡Elegida!/i })).toBeVisible({ timeout: 30_000 });
  });
});
