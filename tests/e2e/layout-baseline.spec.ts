import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

/**
 * Huella de maquetación: red de seguridad para tocar los estilos.
 *
 * La app carga ocho hojas globales que se pisan entre sí. Cambiar una regla
 * puede descolocar una pantalla que nadie tocó, y eso no se ve compilando ni
 * corriendo las pruebas unitarias.
 *
 * Esta prueba mide, en pantallas representativas, la geometría de los puntos de
 * referencia (encabezado, título, contenido) y algunos totales. Si un cambio de
 * estilos mueve algo, la prueba lo señala con el número exacto.
 *
 * Se eligieron medidas y no capturas de pantalla a propósito: las capturas
 * dependen de que carguen tipografías e imágenes externas, que en un contenedor
 * sin salida a internet no cargan, con lo que darían falsas alarmas.
 *
 * **Para actualizar la referencia a propósito** (cuando el cambio de diseño es
 * deseado), borrar `tests/e2e/layout-baseline.json` y volver a correr la prueba:
 * se regenera sola. Revisar el diff antes de aceptarlo.
 */

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';
const REFERENCIA = path.join(__dirname, 'layout-baseline.json');

/** Tolerancia en píxeles: distintas versiones del navegador redondean distinto. */
const TOLERANCIA = 4;

const RUTAS = [
  { ruta: '/admin', conSesion: true },
  { ruta: '/customers', conSesion: true },
  { ruta: '/presupuestos', conSesion: true },
  { ruta: '/', conSesion: false },
  { ruta: '/simulador-de-presupuesto', conSesion: false },
  { ruta: '/catalogo/bodas', conSesion: false },
  // Cubren los tres modos de `ak-red-premium-surface`, que es donde viven los
  // estilos globales mas agresivos: "live", "client" y "public".
  // Ojo: la presentacion LED vive en `/presentacion-led`, no bajo `/empresa`.
  // Antes se media `/empresa/presentacion-led`, que no existe, y la referencia
  // guardaba una pantalla vacia: parecia cubierta y no cubria nada.
  { ruta: '/presentacion-led', conSesion: false },
  { ruta: '/fiestas/nueva/portal-cliente', conSesion: true },
  { ruta: '/contabilidad/comercial-360', conSesion: true },
];

function createSessionToken() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  return `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`;
}

type Huella = Record<string, number>;

async function medirHuella(page: import('@playwright/test').Page): Promise<Huella> {
  return page.evaluate(() => {
    /** Resume en un numero el color de fondo y de texto de los puntos clave. */
    const huellaDeColor = () => {
      const partes: string[] = [];
      for (const sel of ['body', 'main', 'header', 'h1', 'button', 'a']) {
        const el = document.querySelector(sel);
        if (!el) { partes.push('-'); continue; }
        const c = getComputedStyle(el);
        partes.push(`${c.color}|${c.backgroundColor}|${c.borderColor}`);
      }
      const texto = partes.join('~');
      let h = 0;
      for (let i = 0; i < texto.length; i += 1) h = (h * 31 + texto.charCodeAt(i)) | 0;
      return h;
    };

    const doc = document.documentElement;
    const caja = (selector: string) => {
      const el = document.querySelector(selector) as HTMLElement | null;
      if (!el) return { x: -1, y: -1, w: -1, h: -1 };
      const b = el.getBoundingClientRect();
      return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
    };
    const h1 = caja('h1');
    const header = caja('header');
    const main = caja('main');
    return {
      anchoDocumento: doc.scrollWidth,
      desborde: doc.scrollWidth - doc.clientWidth,
      h1X: h1.x, h1Y: h1.y, h1W: h1.w,
      headerY: header.y, headerH: header.h,
      mainX: main.x, mainW: main.w,
      botones: document.querySelectorAll('button').length,
      enlaces: document.querySelectorAll('a[href]').length,
      // Los colores no se ven en la geometria, y buena parte de las reglas
      // globales los controlan. Se resumen en un numero para poder compararlos.
      colores: huellaDeColor(),
    };
  });
}

function leerReferencia(): Record<string, Huella> {
  if (!fs.existsSync(REFERENCIA)) return {};
  try {
    return JSON.parse(fs.readFileSync(REFERENCIA, 'utf8'));
  } catch {
    return {};
  }
}

test.describe('huella de maquetación', () => {
  test('las pantallas de referencia mantienen su geometría', async ({ page, context, baseURL }) => {
    test.setTimeout(600_000);

    await context.addInitScript(() => {
      window.localStorage.setItem('ak_session', 'true');
      window.sessionStorage.setItem('ak_session', 'true');
    });
    await context.addCookies([
      { name: 'ak_session', value: createSessionToken(), url: baseURL!, httpOnly: true, sameSite: 'Lax' },
    ]);

    // La geometria depende del tamano de pantalla, asi que cada perfil de
    // Playwright (escritorio y celular) guarda su propia referencia.
    const perfil = test.info().project.name;
    const clave = (ruta: string) => `${perfil} ${ruta}`;

    const referencia = leerReferencia();
    const actual: Record<string, Huella> = {};
    const desvios: string[] = [];
    /** Fallas que valen aunque la referencia diga que "siempre fue asi". */
    const absolutos: string[] = [];

    for (const { ruta } of RUTAS) {
      await page.goto(ruta, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.waitForTimeout(2500);
      const huella = await medirHuella(page);
      actual[clave(ruta)] = huella;

      // Reglas absolutas: no dependen de la referencia. Sin esto, la referencia
      // congelaba defectos como si fueran lo normal (paso de verdad: el catalogo
      // se salia 54px en celular y la prueba lo daba por bueno porque "no habia
      // cambiado").
      if (huella.desborde > 2) {
        absolutos.push(`${ruta} · se sale ${huella.desborde}px a lo ancho`);
      }
      if (huella.h1W === -1 && huella.mainX === -1) {
        absolutos.push(`${ruta} · no tiene ni titulo ni contenido: la ruta no existe o no carga`);
      }

      const esperado = referencia[clave(ruta)];
      if (!esperado) continue;

      for (const [medida, valor] of Object.entries(actual[clave(ruta)])) {
        const antes = esperado[medida];
        if (typeof antes !== 'number') continue;
        // Los conteos son exactos; las medidas geométricas admiten redondeo.
        const margen = medida === 'botones' || medida === 'enlaces' ? 0 : TOLERANCIA;
        if (Math.abs(valor - antes) > margen) {
          desvios.push(`${ruta} · ${medida}: era ${antes}, ahora ${valor}`);
        }
      }
    }

    // Primera corrida (o referencia borrada a proposito): se genera la referencia
    // pero las reglas absolutas se exigen igual, para no grabar un defecto.
    const faltaEsteperfil = !Object.keys(referencia).some((k) => k.startsWith(`${perfil} `));
    if (Object.keys(referencia).length === 0 || faltaEsteperfil) {
      fs.writeFileSync(REFERENCIA, `${JSON.stringify({ ...referencia, ...actual }, null, 2)}\n`);
      test.info().annotations.push({ type: 'referencia', description: `Huella generada para ${perfil}.` });
      expect(absolutos, `Pantallas con defectos propios:\n  ${absolutos.join('\n  ')}`).toEqual([]);
      return;
    }

    expect(absolutos, `Pantallas con defectos propios:\n  ${absolutos.join('\n  ')}`).toEqual([]);
    expect(desvios, `La maquetación cambió:\n  ${desvios.join('\n  ')}`).toEqual([]);
  });
});
