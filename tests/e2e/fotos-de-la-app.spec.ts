import { test } from '@playwright/test';
import crypto from 'node:crypto';
import fs from 'fs';
import path from 'path';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

/**
 * Fotos de las pantallas que ve el cliente y el invitado.
 *
 * No comprueba nada: saca las fotos para que alguien las mire con ojo de
 * vendedor. Las pruebas de siempre controlan que las pantallas FUNCIONEN; esto
 * es para ver si además se ven bien, que es otra cosa y no la miraba nadie.
 *
 * Corre sólo cuando se pide, con AK_FOTOS=true, para no sumar minutos a cada
 * corrida.
 */

const ACTIVA = process.env.AK_FOTOS === 'true';
const ID = 'e2e_fotos_app';
const CLAVE = 'clave-fotos-e2e';
const SALIDA = path.join(process.cwd(), 'capturas');
const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';

/** Las pantallas del equipo piden sesión: sin esto redirigen al ingreso. */
function crearTokenDeSesion() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  const firma = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${firma}`;
}

const FIESTA = crearFiestaDeEstaNoche({ id: ID, clavePortal: CLAVE });

const PANTALLAS: Array<{ nombre: string; url: string }> = [
  { nombre: 'landing-publica', url: '/' },
  { nombre: 'simulador-de-presupuesto', url: '/simulador-de-presupuesto' },
  { nombre: 'portal-del-cliente', url: `/portal/c/${CLAVE}` },
  { nombre: 'portal-cliente-por-id', url: `/portal-cliente/${ID}` },
  { nombre: 'muro-social', url: `/evento/social/${ID}` },
  { nombre: 'buzon-de-deseos', url: `/evento/buzon/${ID}` },
  { nombre: 'fotocabina', url: `/evento/fotocabina/${ID}` },
  { nombre: 'galeria-de-la-fiesta', url: `/evento/galeria/${ID}` },
  { nombre: 'confirmar-invitados', url: `/evento/actual/checkin?fiestaId=${ID}&guestId=${FIESTA.invitados?.[0]?.id ?? ''}` },
  { nombre: 'presentacion-led', url: '/presentacion-led' },

  // Entretenimiento, estación por estación. Es lo que el invitado toca en la
  // fiesta y lo que hace que se acuerde de AK.
  { nombre: 'estacion-espejo-magico', url: `/evento/espejo-magico/${ID}` },
  { nombre: 'estacion-plataforma-360', url: `/evento/plataforma-360/${ID}` },
  { nombre: 'estacion-touchpix', url: `/evento/touchpix/${ID}` },
  { nombre: 'estacion-video-vida', url: `/evento/video-vida/${ID}` },
  { nombre: 'estacion-zona-digital', url: `/evento/zona-digital/${ID}` },
  { nombre: 'estacion-mi-mesa', url: `/evento/mi-mesa/${ID}` },
  { nombre: 'estacion-barra', url: `/evento/barra/${ID}` },
  { nombre: 'estacion-dj', url: `/evento/dj/${ID}` },
  { nombre: 'estacion-hub', url: `/evento/hub/${ID}` },
  { nombre: 'estacion-accesos', url: `/evento/accesos/${ID}` },

  // Pantalla gigante y las pantallas de la noche.
  { nombre: 'pantalla-gigante-muro-en-vivo', url: `/evento/muro-en-vivo/${ID}` },
  { nombre: 'pantalla-gigante-en-vivo', url: `/evento/en-vivo/${ID}` },
  { nombre: 'estacion-impresion', url: `/evento/impresion/${ID}` },
  { nombre: 'estacion-moderacion', url: `/evento/moderacion/${ID}` },
  { nombre: 'estacion-logistica', url: `/evento/logistica/${ID}` },
];

test.describe('fotos de la app', () => {
  test.skip(!ACTIVA, 'Se corre a pedido con AK_FOTOS=true');

  test.beforeAll(() => {
    fs.mkdirSync(SALIDA, { recursive: true });
    guardarFiesta(FIESTA);
  });

  test.afterAll(() => {
    borrarFiesta(ID);
  });

  for (const pantalla of PANTALLAS) {
    test(`foto de ${pantalla.nombre}`, async ({ page }, testInfo) => {
      test.setTimeout(90_000);
      const dispositivo = testInfo.project.name.includes('mobile') ? 'celular' : 'escritorio';
      await page.goto(pantalla.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);

      /**
       * Bajar despacio hasta el final antes de fotografiar.
       *
       * Varias secciones aparecen recién cuando entran en pantalla. Sin este
       * paseo, la foto de página completa las agarra invisibles y sale medio
       * blanca: parece una pantalla rota cuando en realidad está bien.
       */
      await page.evaluate(async () => {
        const alto = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += alto) {
          window.scrollTo(0, y);
          await new Promise(r => setTimeout(r, 250));
        }
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 400));
      });
      await page.waitForTimeout(1200);

      // La primera pantalla, que es la que decide si el cliente sigue mirando.
      await page.screenshot({
        path: path.join(SALIDA, `${dispositivo}-${pantalla.nombre}-primera-vista.png`),
      });
      await page.screenshot({
        path: path.join(SALIDA, `${dispositivo}-${pantalla.nombre}.png`),
        fullPage: true,
      });
    });
  }
});

/**
 * Las pantallas del equipo también venden.
 *
 * El dueño las abre adelante del cliente en la reunión: el presupuesto, el
 * calendario, la lista de invitados. Una pantalla interna desprolija se ve igual
 * que una pública desprolija.
 */
/**
 * Todos los módulos, sacados del propio proyecto.
 *
 * Se listan a mano nunca: se recorren las carpetas y se arma la lista sola. Así
 * cuando alguien agrega una pantalla nueva, entra en la próxima tanda de fotos
 * sin que nadie se acuerde de anotarla.
 */
function rutasDelEquipo(): Array<{ nombre: string; url: string }> {
  const raiz = path.join(process.cwd(), 'src/app/(app)');
  const rutas: Array<{ nombre: string; url: string }> = [];

  const recorrer = (dir: string, partes: string[]) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entrada.isDirectory()) continue;
      const nombre = entrada.name;
      // Los grupos entre paréntesis no son parte de la dirección.
      const siguientes = nombre.startsWith('(') ? partes : [...partes, nombre];
      recorrer(path.join(dir, nombre), siguientes);
    }
    if (!fs.existsSync(path.join(dir, 'page.tsx'))) return;

    // Las que atrapan cualquier dirección no se pueden fotografiar solas.
    if (partes.some(p => p.startsWith('[...'))) return;

    const url = '/' + partes.map(p => (p.startsWith('[') ? ID : p)).join('/');
    const nombre = partes.length === 0 ? 'inicio' : partes.join('-').replace(/[[\]]/g, '');
    rutas.push({ nombre: `equipo-${nombre}`, url });
  };

  recorrer(raiz, []);
  return rutas.sort((a, b) => a.url.localeCompare(b.url));
}

const PANTALLAS_DEL_EQUIPO = rutasDelEquipo();

test.describe('fotos de las pantallas del equipo', () => {
  test.skip(!ACTIVA, 'Se corre a pedido con AK_FOTOS=true');

  test.beforeAll(() => {
    fs.mkdirSync(SALIDA, { recursive: true });
  });

  test.beforeEach(async ({ context, baseURL }) => {
    if (!baseURL) throw new Error('Playwright baseURL no configurada.');
    await context.addInitScript(() => {
      window.localStorage.setItem('ak_session', 'true');
      window.sessionStorage.setItem('ak_session', 'true');
    });
    await context.addCookies([
      { name: 'ak_session', value: crearTokenDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
    ]);
  });

  for (const pantalla of PANTALLAS_DEL_EQUIPO) {
    test(`foto de ${pantalla.nombre}`, async ({ page }, testInfo) => {
      test.setTimeout(120_000);
      const dispositivo = testInfo.project.name.includes('mobile') ? 'celular' : 'escritorio';
      // Son más de doscientas: en celular tardaría el doble y estas pantallas se
      // usan sobre todo en la computadora. Las del cliente sí van en los dos.
      test.skip(dispositivo === 'celular', 'Las del equipo se fotografían en escritorio');
      await page.goto(pantalla.url, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);
      await page.screenshot({
        path: path.join(SALIDA, `${dispositivo}-${pantalla.nombre}-primera-vista.png`),
      });
    });
  }
});
