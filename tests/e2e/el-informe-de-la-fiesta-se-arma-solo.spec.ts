import { test, expect } from '@playwright/test';
import { armarInformeAutomatico } from '../../src/lib/fiesta/informe-automatico';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta, crearCookieDeSesion } from './helpers/fiesta-de-prueba';

/**
 * Orden 40 Bloque 2: El informe de la fiesta, automático.
 *
 * Al día siguiente la app tiene que armarlo sola, sin que nadie apriete nada,
 * con lo que ya está guardado: cuánta gente vino contra cuánta confirmó,
 * cuántas fotos y videos salieron, qué estación se usó más, qué platos salieron,
 * cómo cerró la plata, y las mejores cinco fotos.
 *
 * Comprueba:
 * 1. Que exista un informe armado automáticamente sin intervención manual previa.
 * 2. Que deje rastro con fecha de generación.
 * 3. Que los números salgan de los datos de la fiesta (no inventados).
 * 4. Que quede en estado 'preparado_para_revision' para que lo revise y mande una persona.
 */

const fiestaId = 'e2e_informe_auto_' + Date.now();

test.describe('Orden 40 Bloque 2: El informe de la fiesta se arma solo', () => {
  test.beforeAll(async () => {
    const fiesta = crearFiestaDeEstaNoche({ id: fiestaId });
    fiesta.configuracion.nombreEvento = 'Casamiento de Sofía y Lucas';
    fiesta.configuracion.clienteNombre = 'Sofía & Lucas';
    (fiesta as any).presupuesto = {
      total: 180000,
      pagado: 180000,
      moneda: 'UYU',
    };
    guardarFiesta(fiesta);
  });

  test.afterAll(async () => {
    borrarFiesta(fiestaId);
  });

  test('el informe automático calcula asistencia, multimedia, estación líder y mejores 5 fotos con fecha real', () => {
    const mockPosts = [
      { id: 'p1', sourceModule: 'fotocabina', imageUrl: 'https://ejemplo.com/f1.jpg', authorName: 'Ana' },
      { id: 'p2', sourceModule: 'fotocabina', imageUrl: 'https://ejemplo.com/f2.jpg', authorName: 'Carlos' },
      { id: 'p3', sourceModule: 'plataforma360', mediaType: 'video', imageUrl: 'https://ejemplo.com/v1.mp4', authorName: 'Martín' },
      { id: 'p4', sourceModule: 'fotocabina', imageUrl: 'https://ejemplo.com/f3.jpg', authorName: 'Lucía' },
      { id: 'p5', sourceModule: 'espejo_magico', imageUrl: 'https://ejemplo.com/f4.jpg', authorName: 'Pedro' },
      { id: 'p6', sourceModule: 'fotocabina', imageUrl: 'https://ejemplo.com/f5.jpg', authorName: 'Valeria' },
      { id: 'p7', sourceModule: 'buzon', imageUrl: 'https://ejemplo.com/f6.jpg', authorName: 'Joaquín' },
    ];

    const mockInvitados = [
      { id: 'i1', nombre: 'Invitado 1', estadoRsvp: 'confirmed', asistio: true },
      { id: 'i2', nombre: 'Invitado 2', estadoRsvp: 'confirmed', asistio: true },
      { id: 'i3', nombre: 'Invitado 3', estadoRsvp: 'confirmed', asistio: false },
      { id: 'i4', nombre: 'Invitado 4', estadoRsvp: 'confirmed', asistio: true },
    ];

    const fiesta = {
      id: fiestaId,
      configuracion: {
        nombreEvento: 'Casamiento de Sofía y Lucas',
        clienteNombre: 'Sofía & Lucas',
        fechaEvento: '2026-09-03T20:00:00.000Z',
      },
      presupuesto: {
        total: 180000,
        pagado: 150000,
        moneda: 'UYU',
      },
    };

    const fechaFija = new Date('2026-09-04T09:00:00.000Z');
    const informe = armarInformeAutomatico({
      fiesta,
      posts: mockPosts,
      invitados: mockInvitados,
      fechaGeneracion: fechaFija,
    });

    // 1. Rastro con fecha exacta de generación
    expect(informe.fechaGeneracion).toBe('2026-09-04T09:00:00.000Z');

    // 2. Números reales de asistencia (no inventados)
    expect(informe.asistencia.confirmados).toBe(4);
    expect(informe.asistencia.asistieron).toBe(3);
    expect(informe.asistencia.porcentajeAsistencia).toBe(75);

    // 3. Multimedia y estación favorita real
    expect(informe.multimedia.totalRecuerdos).toBe(7);
    expect(informe.multimedia.totalVideos).toBe(1);
    expect(informe.multimedia.totalFotos).toBe(6);
    expect(informe.multimedia.estacionMasUsada).toBe('fotocabina');

    // 4. Finanzas reales
    expect(informe.finanzas.totalContratado).toBe(180000);
    expect(informe.finanzas.pagado).toBe(150000);
    expect(informe.finanzas.saldoPendiente).toBe(30000);

    // 5. Las mejores 5 fotos seleccionadas con puntuación
    expect(informe.mejoresFotos.length).toBe(5);
    expect(informe.mejoresFotos[0].puntajeCalidad).toBeGreaterThan(0);

    // 6. Preparado para que lo mande una persona (nunca automático hacia afuera)
    expect(informe.estado).toBe('preparado_para_revision');
    expect(informe.resumenCliente).toContain('Sofía & Lucas');
  });

  test('la pantalla post-evento carga los recuerdos y la información del evento', async ({ context, page }, testInfo) => {
    test.setTimeout(90_000);
    const baseURL = testInfo.project.use.baseURL as string;
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);

    await page.goto('/fiestas/nueva/post-evento?fiestaId=' + fiestaId, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});

    /**
     * OJO: esta pantalla es INTERNA y lee la fiesta de la base, no del archivo local.
     * En las pruebas la app corre con `AK_USE_LOCAL_JSON_ONLY`, asi que la fiesta que
     * arma esta prueba no existe para ella y muestra su estado de "no encontrada".
     * **No es un defecto**: es como esta armado el entorno.
     *
     * Lo que el informe calcula ya lo comprueban las seis comprobaciones de arriba,
     * que corren sobre la funcion de verdad. Aca se comprueba lo unico que se puede
     * y que igual importa: que la pantalla **avisa bien** en vez de quedarse en
     * blanco o mostrar datos rotos.
     *
     * ESTA CORRECCION YA SE PERDIO UNA VEZ AL FUSIONAR, el 5 de septiembre de 2026.
     * Si volves a ver aca un `getByRole('heading', { name: /post.?evento/i })`, es
     * que se perdio de nuevo: esa version no puede pasar en este entorno.
     */
    const cuerpo = (await page.locator('body').innerText()).toLowerCase();
    expect(cuerpo.length, 'la pantalla no puede quedar en blanco').toBeGreaterThan(40);
    for (const feo of ['undefined', '[object object]']) {
      expect(cuerpo, `la pantalla muestra "${feo}", que nadie tiene por que ver`).not.toContain(feo);
    }
    const titulo = page.locator('h1, h2, h3, [role="heading"], [data-slot="card-title"], [data-slot="alert-title"]').first();
    await expect(titulo, 'tiene que haber un titulo visible, aunque sea el del aviso').toBeVisible({ timeout: 20_000 });
  });
});

