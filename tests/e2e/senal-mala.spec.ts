import { expect, test, type Page } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, crearPermisoDeEstacion } from './helpers/fiesta-de-prueba';

/**
 * La fiesta con el WiFi saturado.
 *
 * En un salón con 150 invitados el WiFi se cae a pedazos: las consultas tardan
 * mucho o directamente no vuelven. Una pantalla que en esa situación se queda
 * girando para siempre es, para el invitado, una pantalla rota.
 *
 * Acá se simulan las dos formas en que falla la señal en una fiesta:
 * 1. **Lenta**: cada consulta demora varios segundos.
 * 2. **Cortada**: las consultas directamente no llegan.
 *
 * Lo que se exige no es que funcione igual, sino que **diga algo**: un aviso, un
 * texto, lo que sea menos una ruedita eterna. El invitado tiene que poder
 * entender que el problema es la señal y no la fiesta.
 */

const fiesta = crearFiestaDeEstaNoche({ id: `e2e_senal_${Date.now()}` });
const ID = fiesta.id;

test.afterAll(() => {
  borrarFiesta(ID);
});

/** Lo que el invitado abre desde el celular en plena fiesta. */
const PANTALLAS = [
  `/evento/mi-mesa/${ID}`,
  `/evento/social/${ID}`,
  `/evento/galeria/${ID}`,
  `/evento/barra/${ID}`,
  `/invitacion/${ID}/rsvp`,
  `/evento/buzon/${ID}?access=${crearPermisoDeEstacion(ID, 'capsulaTiempo')}`,
];

/** Tiempo que se le da a una pantalla para decir algo. Es mucho: en la fiesta,
 *  nadie espera veinticinco segundos mirando una ruedita. */
const PACIENCIA_MS = 25_000;

/** Sigue esperando: o está vacía, o sigue diciendo "cargando". */
const SIGUE_ESPERANDO = /cargando|loading|espera/i;

function sigueColgada(texto: string) {
  const limpio = texto.trim();
  if (limpio.length < 20) return true;
  // "Cargando tu invitación…" es corto pero no es un error: lo que no puede
  // pasar es que siga diciendo eso después de veinticinco segundos.
  return SIGUE_ESPERANDO.test(limpio) && limpio.length < 120;
}

async function textoUtil(page: Page) {
  const arranque = Date.now();
  let texto = '';
  while (Date.now() - arranque < PACIENCIA_MS) {
    texto = await page.locator('body').innerText().catch(() => '');
    if (!sigueColgada(texto)) return texto;
    await page.waitForTimeout(1000);
  }
  return texto;
}

test.describe('la fiesta con el WiFi saturado', () => {
  test('con la señal lenta, ninguna pantalla queda girando', async ({ page }) => {
    test.setTimeout(600_000);

    // Cada llamada al servidor demora tres segundos, como en un salón lleno.
    await page.route('**/*', async (ruta) => {
      const tipo = ruta.request().resourceType();
      if (tipo === 'document' || tipo === 'fetch' || tipo === 'xhr') {
        await new Promise((r) => setTimeout(r, 3000));
      }
      await ruta.continue();
    });

    const colgadas: string[] = [];
    for (const pantalla of PANTALLAS) {
      await page.goto(pantalla, { waitUntil: 'domcontentloaded' }).catch(() => {});
      const texto = await textoUtil(page);
      if (sigueColgada(texto)) colgadas.push(`${pantalla} → ${texto.trim().slice(0, 40) || '(en blanco)'}`);
    }

    expect(colgadas, `Con la señal lenta se quedaron girando:\n  ${colgadas.join('\n  ')}`).toEqual([]);
  });

  test('con la señal cortada, el invitado ve un aviso y no una ruedita eterna', async ({ page }) => {
    test.setTimeout(600_000);

    // La pantalla carga, pero después ninguna consulta de datos vuelve.
    await page.route('**/*', async (ruta) => {
      const tipo = ruta.request().resourceType();
      if (tipo === 'fetch' || tipo === 'xhr') {
        await ruta.abort('internetdisconnected');
        return;
      }
      await ruta.continue();
    });

    const mudas: string[] = [];
    for (const pantalla of PANTALLAS) {
      await page.goto(pantalla, { waitUntil: 'domcontentloaded' }).catch(() => {});
      const texto = await textoUtil(page);
      if (sigueColgada(texto)) mudas.push(`${pantalla} → ${texto.trim().slice(0, 40) || '(en blanco)'}`);
    }

    expect(mudas, `Sin señal se quedaron mudas, sin decirle nada al invitado:\n  ${mudas.join('\n  ')}`).toEqual([]);
  });
});
