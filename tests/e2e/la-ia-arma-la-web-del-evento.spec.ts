import { expect, test } from '@playwright/test';
import {
  crearFiestaDeEstaNoche,
  guardarFiesta,
  borrarFiesta,
  ponerSesionDelEquipo,
} from './helpers/fiesta-de-prueba';
import { defaultInvitacionDigitalData } from '../../src/lib/invitacion-digital-defaults';

/**
 * Orden 234 — La IA arma sola la web del evento (26/10/2026)
 *
 * Navegador, tests/e2e/la-ia-arma-la-web-del-evento.spec.ts. Con la respuesta del servidor cortada
 * y simulada, comprobar:
 * - tocar "Armar con IA" muestra el nombre en la vista previa;
 * - "Deshacer" lo saca.
 */

test.describe('Orden 234 — La IA arma la web del evento', () => {
  let fiestaId: string;

  test.beforeEach(async () => {
    fiestaId = `e2e_web_ia_${Date.now()}`;
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.invitacionDigital = {
      ...defaultInvitacionDigitalData,
      cabecera: {
        ...defaultInvitacionDigitalData.cabecera,
        protagonista1: 'Nombre Anterior',
      },
      bienvenida: {
        ...defaultInvitacionDigitalData.bienvenida,
        texto: { text: 'Texto de prueba cargado.', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#000' } },
      },
    };
    guardarFiesta(fiesta);
  });

  test.afterEach(async () => {
    if (fiestaId) {
      borrarFiesta(fiestaId);
    }
  });

  test('tocar "Armar con IA" muestra el nombre en la vista previa y "Deshacer" lo saca', async ({ page, context, baseURL }) => {
    test.setTimeout(120_000);
    await ponerSesionDelEquipo(context, baseURL);

    const NOMBRE_GENERADO_IA = 'Camila IA';

    // Interceptar la Server Action cuando se toca "Armar con IA" y simular la respuesta del servidor
    // Se arma DESPUÉS de cargar la pantalla y responde sólo al PRIMER pedido al servidor que sale del toque:
    // si cortara todos, también cortaría la verificación de la sesión y la pantalla rebotaría al ingreso.
    let armada = false;
    let yaSimulada = false;
    const instalarCorte = () => page.route('**/*', async (route) => {
      const req = route.request();
      // Es el pedido de armarWebConIA(fiestaId, { rehacer }) y no otro: se reconoce por lo que manda.
      if (armada && !yaSimulada && req.method() === 'POST' && req.headers()['next-action'] && (req.postData() || '').includes('rehacer')) {
        yaSimulada = true;
        const respuestaSimulada = {
          success: true,
          invitacionDigital: {
            ...defaultInvitacionDigitalData,
            plantilla: 'XvModerna',
            cabecera: {
              ...defaultInvitacionDigitalData.cabecera,
              protagonista1: NOMBRE_GENERADO_IA,
              subtitulo: { text: 'Mis 15 Años', style: { fontFamily: 'Inter', fontSize: '1.25rem', color: '#000' } },
              paletaColores: { primary: '#d4a574', secondary: '#2d3748', accent: '#f7fafc' },
            },
            bienvenida: {
              ...defaultInvitacionDigitalData.bienvenida,
              visible: true,
              titulo: { text: '¡Mis 15 Años!', style: { fontFamily: 'Belleza', fontSize: '2.5rem', color: '#2d3748' } },
              texto: { text: 'Te espero para compartir esta noche tan especial.', style: { fontFamily: 'Inter', fontSize: '1rem', color: '#6b7280' } },
            },
          },
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

    await page.goto(`/fiestas/nueva/pagina-web?fiestaId=${fiestaId}`);
    await instalarCorte();

    // Verificar que inicialmente no aparece el nombre generado por la IA
    await expect(page.getByText(NOMBRE_GENERADO_IA)).toHaveCount(0);

    // Tocar "Armar con IA"
    const botonArmar = page.getByRole('button', { name: /Armar con IA/i });
    await expect(botonArmar).toBeVisible({ timeout: 30_000 });
    // Esperar a que la pantalla termine de cargar la fiesta: si se toca antes, la carga pisa lo que arma la IA.
    await page.waitForLoadState('networkidle');
    await expect(page.getByPlaceholder('Ej: Valentina')).toHaveValue(/\S/, { timeout: 30_000 });
    await page.waitForTimeout(1500);
    armada = true;
    await botonArmar.click();
    await expect.poll(() => yaSimulada, { timeout: 30_000 }).toBe(true);

    // Muestra el nombre generado en la vista previa
    await expect(page.getByText(NOMBRE_GENERADO_IA).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Listo: revisá y ajustá lo que quieras').first()).toBeVisible({ timeout: 10_000 });

    // Tocar "Deshacer"
    const botonDeshacer = page.getByRole('button', { name: /Deshacer/i });
    await expect(botonDeshacer).toBeVisible({ timeout: 10_000 });
    await botonDeshacer.click();

    // "Deshacer" lo saca de la vista previa
    await expect(page.getByText(NOMBRE_GENERADO_IA)).toHaveCount(0);
  });
});
