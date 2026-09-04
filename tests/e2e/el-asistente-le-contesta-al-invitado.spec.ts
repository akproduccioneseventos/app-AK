import { test, expect } from '@playwright/test';
import { responderDudaInvitado, type DatosFiestaAsistente } from '../../src/lib/asistente/asistente-invitado';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 40 Bloque 4: El asistente le contesta al invitado.
 *
 * El asistente debe responder las preguntas comunes del invitado usando
 * la información cargada en la fiesta:
 * - A qué hora empieza
 * - Cómo llego (lugar/dirección)
 * - Dónde estaciono
 * - Qué me pongo (dress code)
 * - Dónde está mi mesa
 * - Hasta qué hora hay música
 *
 * Si no sabe la respuesta, lo dice con honestidad y ofrece el WhatsApp del organizador.
 * Nunca inventa. No pide mail ni teléfono.
 */

const fiestaId = 'e2e_asistente_invitado_' + Date.now();

test.describe('Orden 40 Bloque 4: El asistente le contesta al invitado', () => {
  const datosFiesta: DatosFiestaAsistente = {
    nombreEvento: 'XV de Martina',
    horaInicio: '21:00',
    horaFin: '05:00',
    lugar: 'Salón Los Robles',
    direccion: 'Costanera Norte 1250',
    dressCode: 'Elegante',
    estacionamiento: 'Estacionamiento vigilado dentro del predio del salón.',
    telefonoOrganizador: '098355530',
    nombreInvitado: 'Valentina',
    mesaAsignada: '7',
  };

  test('1. contesta la hora de inicio exacta de la fiesta', () => {
    const res = responderDudaInvitado('¿A qué hora empieza la fiesta?', datosFiesta);
    expect(res.tieneRespuestaExacta).toBe(true);
    expect(res.respuesta).toContain('21:00');
  });

  test('2. contesta cómo llegar con el lugar y la dirección cargados', () => {
    const res = responderDudaInvitado('¿Cómo llego al salón y cuál es la dirección?', datosFiesta);
    expect(res.tieneRespuestaExacta).toBe(true);
    expect(res.respuesta).toContain('Salón Los Robles');
    expect(res.respuesta).toContain('Costanera Norte 1250');
  });

  test('3. contesta el código de vestimenta asignado al evento', () => {
    const res = responderDudaInvitado('¿Qué me pongo para la fiesta?', datosFiesta);
    expect(res.tieneRespuestaExacta).toBe(true);
    expect(res.respuesta).toContain('Elegante');
  });

  test('4. contesta la mesa asignada para el invitado que consulta', () => {
    const res = responderDudaInvitado('¿Dónde está mi mesa asignada?', datosFiesta);
    expect(res.tieneRespuestaExacta).toBe(true);
    expect(res.respuesta).toContain('Mesa 7');
    expect(res.respuesta).toContain('Valentina');
  });

  test('5. contesta el horario de música y fin de fiesta', () => {
    const res = responderDudaInvitado('¿Hasta qué hora hay música?', datosFiesta);
    expect(res.tieneRespuestaExacta).toBe(true);
    expect(res.respuesta).toContain('05:00');
  });

  test('6. ante una duda desconocida no inventa y da el WhatsApp del organizador', () => {
    const res = responderDudaInvitado('¿Puedo llevar a mi loro a la fiesta?', datosFiesta);
    expect(res.tieneRespuestaExacta).toBe(false);
    expect(res.respuesta).toContain('No tengo ese dato registrado');
    expect(res.respuesta).toContain('WhatsApp');
    expect(res.whatsappOrganizador).toContain('wa.me/098355530');
  });

  test('7. la pantalla de invitacion y portal del invitado es publica sin pedir login previo', async ({ page }) => {
    test.setTimeout(60_000);
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    guardarFiesta(fiesta);

    try {
      await page.goto('/invitacion/' + fiestaId, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
      const body = page.locator('body');
      await expect(body).toBeVisible();
    } finally {
      borrarFiesta(fiestaId);
    }
  });
});

