import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { borrarFiesta, crearCookieDeSesion, crearFiestaDeEstaNoche, crearPermisoDeEstacion } from './helpers/fiesta-de-prueba';

/**
 * Los entretenimientos, usados de verdad.
 *
 * Las pruebas que ya existían controlaban que cada estación **abriera**: que el
 * enlace contestara y que no dijera "no autorizado". Eso no alcanza. El dueño
 * las va a usar en una fiesta y necesita saber si **se pueden operar**: si la
 * cámara entra, si el botón principal responde y si la pantalla avanza a algo
 * en vez de quedarse dura.
 *
 * Por eso acá cada estación se abre dos veces —como operador con la sesión del
 * equipo, y como invitado con el permiso que lleva el QR—, se le toca el botón
 * principal y se mira qué pasó después. Cada paso deja una foto de pantalla en
 * `test-results/`, que es lo único que permite ver lo que vería una persona.
 *
 * La fotocabina queda afuera a propósito: la está trabajando otra IA en
 * paralelo y dos pruebas sobre la misma pantalla se pisan.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_entretenimientos_${Date.now()}` });
const ID = fiesta.id;

test.afterAll(() => {
  borrarFiesta(ID);
});

/**
 * Basura técnica que NUNCA tiene que llegar a la pantalla del operador.
 *
 * Esto no es un detalle de prolijidad: durante meses cada estación mostraba el
 * error crudo de la base —en inglés, con el nombre del campo y un consejo de
 * programador— y encima significaba que la estación no arrancaba. El operador
 * de una fiesta no puede hacer nada con ese texto.
 */
const BASURA_TECNICA = [
  /firestore/i,
  /undefined/i,
  /is not a valid/i,
  /ignoreUndefinedProperties/i,
  /at Object\./i,
  /TypeError/i,
];

/**
 * En este contenedor no hay base de datos: no hay credenciales cargadas.
 *
 * Todo lo que necesita guardar algo —abrir la sesión de una estación, subir una
 * foto— falla acá y **no es un defecto de la app**. Lo que sí se puede probar, y
 * es lo que importa, es que la pantalla abra, que entre la cámara, que los
 * botones respondan y que cuando algo falle lo diga en criollo y no en inglés.
 */
const SIN_BASE_DE_DATOS = [
  /no se pudo abrir la sesion de la estacion/i,
  /no se pudo guardar/i,
  /sin conexion con la base/i,
];

/** Textos que delatan que la pantalla no encontró con qué trabajar. */
const SENALES_DE_FALLA = [
  /no se encontr/i,
  /no encontr[ée]/i,
  /evento no encontrado/i,
  /fiesta no encontrada/i,
  /enlace (invalido|inválido|vencido)/i,
  /application error/i,
  /something went wrong/i,
  /internal server error/i,
  /experiencia no disponible/i,
  /este acceso no es válido/i,
  /acceso (denegado|restringido|no autorizado)/i,
  /no se pudo abrir esta estacion/i,
];

type Estacion = {
  /** Cómo se llama en criollo, para que el informe se entienda. */
  nombre: string;
  /** Id del módulo, el que firma el permiso del QR. */
  modulo: string;
  /** Lo que abre el operador, con la sesión del equipo. */
  operador: string;
  /** Lo que abre el invitado escaneando el QR. Vacío = no tiene lado invitado. */
  invitado?: (acceso: string) => string;
  /**
   * Si en ESTA vista se espera ver la imagen de la cámara.
   *
   * El panel del operador no la tiene y está bien: es un tablero de control con
   * los ajustes y el botón de disparo. La cámara vive en la pantalla que el
   * operador abre aparte ("ABRIR PANTALLA"), que es la que mira el invitado.
   */
  camaraOperador: boolean;
  camaraInvitado: boolean;
  /** Las pantallas de exhibición (tótem, muro) no tienen botones: se miran. */
  seMira?: boolean;
};

const ESTACIONES: Estacion[] = [
  {
    nombre: 'Plataforma 360',
    modulo: 'plataforma360',
    operador: `/evento/plataforma-360/${ID}?role=operator`,
    invitado: (acceso) => `/evento/plataforma-360/${ID}?access=${acceso}`,
    camaraOperador: false,
    camaraInvitado: true,
  },
  {
    nombre: 'Bogue',
    modulo: 'bogue',
    operador: `/evento/bogue/${ID}?role=operator`,
    invitado: (acceso) => `/evento/bogue/${ID}?access=${acceso}`,
    camaraOperador: false,
    camaraInvitado: true,
  },
  {
    nombre: 'Espejo mágico — foto',
    modulo: 'espejoMagicoFoto',
    operador: `/evento/espejo-magico/${ID}?mode=foto&role=operator`,
    invitado: (acceso) => `/evento/espejo-magico/${ID}?mode=foto&access=${acceso}`,
    camaraOperador: false,
    camaraInvitado: true,
  },
  {
    nombre: 'Espejo mágico — firma',
    modulo: 'espejoMagicoFirma',
    operador: `/evento/espejo-magico/${ID}?mode=firma&role=operator`,
    invitado: (acceso) => `/evento/espejo-magico/${ID}?mode=firma&access=${acceso}`,
    camaraOperador: false,
    camaraInvitado: true,
  },
  {
    nombre: 'Espejo mágico — IA',
    modulo: 'espejoMagicoIA',
    operador: `/evento/espejo-magico/${ID}?mode=ia&role=operator`,
    invitado: (acceso) => `/evento/espejo-magico/${ID}?mode=ia&access=${acceso}`,
    camaraOperador: false,
    camaraInvitado: true,
  },
  {
    nombre: 'Touchpix',
    modulo: 'espejoMagicoIA',
    operador: `/evento/touchpix/${ID}?role=operator`,
    invitado: (acceso) => `/evento/touchpix/${ID}?access=${acceso}`,
    camaraOperador: false,
    camaraInvitado: true,
  },
  {
    nombre: 'Cápsula del tiempo (buzón)',
    modulo: 'capsulaTiempo',
    operador: `/evento/buzon/${ID}`,
    invitado: (acceso) => `/evento/buzon/${ID}?access=${acceso}`,
    camaraOperador: false,
    camaraInvitado: false,
  },
  {
    nombre: 'Tótem interactivo',
    modulo: 'totems',
    operador: `/evento/totem/${ID}/totem-principal`,
    invitado: (acceso) => `/evento/social/${ID}?estacion=totems&access=${acceso}`,
    camaraOperador: false,
    camaraInvitado: false,
    seMira: true,
  },
  {
    nombre: 'Muro en vivo',
    modulo: 'totems',
    operador: `/evento/muro-en-vivo/${ID}`,
    invitado: (acceso) => `/evento/social/${ID}?access=${acceso}`,
    camaraOperador: false,
    camaraInvitado: false,
    seMira: true,
  },
];

/** Pantallas del invitado que no piden permiso: se llega por el enlace personal. */
const INVITADO = { id: 'inv_prueba_0', token: 'token-prueba-0' };

const PANTALLAS_DEL_INVITADO = [
  { nombre: 'Zona digital', ruta: `/evento/zona-digital/${ID}` },
  // El hub se abre con el enlace personal del invitado. Sin eso la app niega el
  // acceso, y hace bien: es la pantalla que muestra sus datos.
  { nombre: 'Hub de la fiesta', ruta: `/evento/hub/${ID}?guestId=${INVITADO.id}&token=${INVITADO.token}` },
  { nombre: 'Galería de la fiesta', ruta: `/evento/galeria/${ID}` },
  { nombre: 'Mi mesa', ruta: `/evento/mi-mesa/${ID}` },
  { nombre: 'Pantalla de invitados en vivo', ruta: `/evento/en-vivo/${ID}/invitados` },
  // El video de vida del invitado vive en `/video-vida`. `/evento/video-vida` es
  // la pantalla del equipo y pide sesión, por eso no va en esta lista.
  { nombre: 'Video de vida (familia)', ruta: `/video-vida/${ID}` },
];

/**
 * Cámara y micrófono falsos.
 *
 * Sin esto el navegador de prueba no entrega ninguna señal y toda estación que
 * filme queda esperando para siempre, que es una falla inventada y no un
 * defecto de la app.
 */
async function enchufarCamaraFalsa(page: Page) {
  await page.addInitScript(() => {
    const armarSenal = () => {
      const lienzo = document.createElement('canvas');
      lienzo.width = 720;
      lienzo.height = 1280;
      const pincel = lienzo.getContext('2d');
      if (pincel) {
        pincel.fillStyle = '#2b1055';
        pincel.fillRect(0, 0, lienzo.width, lienzo.height);
        pincel.fillStyle = '#ffffff';
        pincel.font = '48px sans-serif';
        pincel.fillText('CAMARA DE PRUEBA', 60, 640);
      }
      return lienzo.captureStream(30);
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => armarSenal(),
        enumerateDevices: async () => [
          { deviceId: 'camara-de-prueba', kind: 'videoinput', label: 'Camara de prueba', groupId: 'g' },
          { deviceId: 'micro-de-prueba', kind: 'audioinput', label: 'Micro de prueba', groupId: 'g' },
        ],
        addEventListener: () => {},
        removeEventListener: () => {},
      },
    });
  });
}

async function ponerSesionDelEquipo(context: BrowserContext, baseURL: string) {
  await context.addCookies([
    { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL, httpOnly: true, sameSite: 'Lax' },
  ]);
}

type Falla = { donde: string; problema: string };

/**
 * Abre una pantalla, la mira, le toca el botón principal y vuelve a mirarla.
 *
 * Devuelve la lista de problemas encontrados, en criollo. No corta en el primer
 * error a propósito: interesa el estado de todas las estaciones de una vez, no
 * la primera que falla.
 */
async function operarPantalla(
  page: Page,
  etiqueta: string,
  ruta: string,
  opciones: { camara: boolean; tocarBoton: boolean },
): Promise<Falla[]> {
  const fallas: Falla[] = [];
  const erroresJs: string[] = [];
  const escucha = (e: Error) => erroresJs.push(e.message);
  page.on('pageerror', escucha);

  try {
    const respuesta = await page.goto(ruta, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    const codigo = respuesta?.status() ?? 0;
    if (codigo >= 400) {
      fallas.push({ donde: etiqueta, problema: `la pantalla contesta con error ${codigo}` });
      return fallas;
    }

    await page.waitForTimeout(2_500);
    const texto = (await page.locator('body').innerText().catch(() => '')) || '';

    for (const senal of SENALES_DE_FALLA) {
      if (senal.test(texto)) {
        fallas.push({ donde: etiqueta, problema: `la pantalla dice: "${texto.match(senal)?.[0]}"` });
      }
    }

    for (const senal of BASURA_TECNICA) {
      if (senal.test(texto)) {
        fallas.push({ donde: etiqueta, problema: `la pantalla muestra texto técnico: "${texto.match(senal)?.[0]}"` });
      }
    }

    if (/\/login/.test(page.url())) {
      fallas.push({ donde: etiqueta, problema: 'la estación manda a la pantalla de entrada en vez de abrirse' });
    }

    if (opciones.camara) {
      const video = page.locator('video').first();
      const hayVideo = await video.count();
      if (!hayVideo) {
        fallas.push({ donde: etiqueta, problema: 'no hay ventana de cámara en la pantalla' });
      } else {
        const anda = await page
          .evaluate(() => {
            const v = document.querySelector('video');
            return Boolean(v && (v as HTMLVideoElement).srcObject);
          })
          .catch(() => false);
        if (!anda) fallas.push({ donde: etiqueta, problema: 'la ventana de cámara está vacía: no le entra la imagen' });
      }
    }

    await page.screenshot({ path: `test-results/entretenimientos/${etiqueta.replace(/[^a-z0-9]+/gi, '-')}-1-abre.png` });

    if (opciones.tocarBoton) {
      const antes = texto;
      const botones = page.locator('button:visible');
      const cuantos = await botones.count();
      if (cuantos === 0) {
        fallas.push({ donde: etiqueta, problema: 'no hay ningún botón para tocar: la pantalla no se puede usar' });
      } else {
        const principal = page
          .getByRole('button', { name: /sacar|capturar|empezar|iniciar|comenzar|grabar|crear|arrancar|foto|video|siguiente|jugar/i })
          .and(page.locator('button:not([disabled])'))
          .first();
        const objetivo = (await principal.count()) > 0 ? principal : botones.first();
        const nombre = ((await objetivo.innerText().catch(() => '')) || '').split('\n')[0].slice(0, 40);
        await objetivo.click({ timeout: 15_000 }).catch((e: Error) => {
          fallas.push({ donde: etiqueta, problema: `el botón "${nombre}" no se deja tocar: ${e.message.split('\n')[0]}` });
        });
        await page.waitForTimeout(4_000);
        const despues = (await page.locator('body').innerText().catch(() => '')) || '';
        const nuevo = despues.replace(antes, '');
        const faltaLaBase = SIN_BASE_DE_DATOS.some((senal) => senal.test(nuevo));

        for (const senal of BASURA_TECNICA) {
          if (senal.test(nuevo)) {
            fallas.push({
              donde: etiqueta,
              problema: `después de tocar "${nombre}" la pantalla muestra texto técnico: "${nuevo.match(senal)?.[0]}"`,
            });
          }
        }

        if (despues === antes) {
          fallas.push({ donde: etiqueta, problema: `se tocó "${nombre}" y la pantalla quedó igual: no pasó nada` });
        } else if (!faltaLaBase && /no se pudo|fall[oó]|error|intent[aá] de nuevo/i.test(nuevo)) {
          fallas.push({ donde: etiqueta, problema: `después de tocar "${nombre}" aparece un cartel de error` });
        }
        await page.screenshot({
          path: `test-results/entretenimientos/${etiqueta.replace(/[^a-z0-9]+/gi, '-')}-2-toque.png`,
        });
      }
    }

    for (const error of erroresJs.slice(0, 2)) {
      fallas.push({ donde: etiqueta, problema: `la pantalla se rompe por dentro: ${error.split('\n')[0].slice(0, 120)}` });
    }
  } finally {
    page.off('pageerror', escucha);
  }

  return fallas;
}

test.describe('los entretenimientos se pueden usar', () => {
  test('el operador puede abrir y usar cada estación', async ({ context, page }, testInfo) => {
    test.setTimeout(600_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
    const baseURL = testInfo.project.use.baseURL as string;
    await ponerSesionDelEquipo(context, baseURL);
    await enchufarCamaraFalsa(page);

    const fallas: Falla[] = [];
    for (const estacion of ESTACIONES) {
      fallas.push(
        ...(await operarPantalla(page, `operador — ${estacion.nombre}`, estacion.operador, {
          camara: estacion.camaraOperador,
          tocarBoton: !estacion.seMira,
        })),
      );
    }

    expect(fallas.map((f) => `${f.donde}: ${f.problema}`).join('\n'), 'estaciones del operador').toBe('');
  });

  test('el invitado entra por el QR y la estación lo deja usarla', async ({ context, page }, testInfo) => {
    test.setTimeout(600_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
    await context.clearCookies();
    await enchufarCamaraFalsa(page);

    const fallas: Falla[] = [];
    for (const estacion of ESTACIONES) {
      if (!estacion.invitado) continue;
      const ruta = estacion.invitado(crearPermisoDeEstacion(ID, estacion.modulo));
      fallas.push(
        ...(await operarPantalla(page, `invitado — ${estacion.nombre}`, ruta, {
          camara: estacion.camaraInvitado,
          tocarBoton: !estacion.seMira,
        })),
      );
    }

    expect(fallas.map((f) => `${f.donde}: ${f.problema}`).join('\n'), 'estaciones del invitado').toBe('');
  });

  test('las pantallas del invitado que no piden permiso se ven', async ({ context, page }, testInfo) => {
    test.setTimeout(600_000);
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
    await context.clearCookies();
    await enchufarCamaraFalsa(page);

    const fallas: Falla[] = [];
    for (const pantalla of PANTALLAS_DEL_INVITADO) {
      fallas.push(
        ...(await operarPantalla(page, `invitado — ${pantalla.nombre}`, pantalla.ruta, {
          camara: false,
          tocarBoton: false,
        })),
      );
    }

    expect(fallas.map((f) => `${f.donde}: ${f.problema}`).join('\n'), 'pantallas del invitado').toBe('');
  });
});
