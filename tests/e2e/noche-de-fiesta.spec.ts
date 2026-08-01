import { expect, test, type Page } from '@playwright/test';
import { borrarFiesta, crearCookieDeSesion, crearFiestaDeEstaNoche } from './helpers/fiesta-de-prueba';

/**
 * La noche de la fiesta, pantalla por pantalla.
 *
 * Recorre todo lo que se usa mientras la fiesta está pasando: lo que ve y toca
 * el invitado desde su celular, y lo que maneja el equipo de AK.
 *
 * A diferencia de las pruebas anteriores, acá hay una fiesta de verdad: es hoy,
 * tiene todos los módulos contratados y cuatro invitados ya confirmados con su
 * mesa. Así, una pantalla que diga "no encontré la fiesta" o que aparezca vacía
 * es un defecto real, no falta de datos.
 */

// `AK_E2E_ID` permite fijar el id y dejar la fiesta en disco para inspeccionarla
// a mano mientras se investiga una falla. En una corrida normal se borra sola.
const fiesta = crearFiestaDeEstaNoche({ id: process.env.AK_E2E_ID });
const ID = fiesta.id;

test.afterAll(() => {
  if (!process.env.AK_E2E_ID) borrarFiesta(ID);
});

/** Textos que delatan que la pantalla no encontró con qué trabajar. */
const SENALES_DE_FALLA = [
  /no se encontr/i,
  /no encontr[ée]/i,
  /evento no encontrado/i,
  /fiesta no encontrada/i,
  /application error/i,
  /something went wrong/i,
  /internal server error/i,
];

type Resultado = { ruta: string; problema: string };

async function revisarPantalla(page: Page, ruta: string): Promise<Resultado[]> {
  const problemas: Resultado[] = [];
  const erroresJs: string[] = [];
  const onError = (e: Error) => erroresJs.push(e.message);
  page.on('pageerror', onError);

  const respuesta = await page.goto(ruta, { waitUntil: 'domcontentloaded' }).catch(() => null);
  // Varias pantallas de la noche se refrescan solas cada pocos segundos, así que
  // la red nunca queda del todo quieta: se espera poco y se sigue.
  await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(2500);

  if (!respuesta) {
    problemas.push({ ruta, problema: 'no respondió' });
  } else if (respuesta.status() >= 500) {
    problemas.push({ ruta, problema: `el servidor respondió ${respuesta.status()}` });
  }

  // Varias pantallas muestran una ruedita mientras piden datos. Se espera a que
  // aparezca contenido de verdad, hasta un límite razonable para un celular en
  // una fiesta.
  const arranque = Date.now();
  let texto = '';
  while (Date.now() - arranque < 20_000) {
    texto = await page.locator('body').innerText().catch(() => '');
    if (texto.trim().length >= 40) break;
    await page.waitForTimeout(1000);
  }
  const segundos = Math.round((Date.now() - arranque) / 1000);
  if (texto.trim().length >= 40 && segundos > 12) {
    problemas.push({ ruta, problema: `tardó ${segundos} segundos en mostrar algo` });
  }

  for (const senal of SENALES_DE_FALLA) {
    if (senal.test(texto)) {
      problemas.push({ ruta, problema: `dice "${texto.match(senal)?.[0]}"` });
      break;
    }
  }

  // Una pantalla de la fiesta que después de 20 segundos sigue sin texto está
  // colgada: el invitado ve una ruedita girando y nada más.
  if (texto.trim().length < 40) {
    problemas.push({ ruta, problema: `sigue vacía después de ${segundos} segundos` });
  }

  // Desborde horizontal: en la fiesta todo se usa desde el celular.
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (desborde > 2) {
    problemas.push({ ruta, problema: `se sale ${desborde}px de la pantalla` });
  }

  if (erroresJs.length > 0) {
    problemas.push({ ruta, problema: `falla de JavaScript: ${erroresJs[0]}` });
  }

  page.off('pageerror', onError);
  return problemas;
}

/** Lo que abre el invitado desde su celular durante la fiesta. */
const INVITADO = { id: 'inv_prueba_0', token: 'token-prueba-0' };

const PANTALLAS_DEL_INVITADO = [
  `/evento/hub/${ID}?guestId=${INVITADO.id}&token=${INVITADO.token}`,
  `/evento/mi-mesa/${ID}`,
  `/evento/social/${ID}`,
  `/evento/galeria/${ID}`,
  `/evento/barra/${ID}`,
  `/evento/buzon/${ID}`,
  `/evento/zona-digital/${ID}`,
  `/evento/fotocabina/${ID}`,
  `/evento/plataforma-360/${ID}`,
  `/evento/touchpix/${ID}`,
  `/evento/espejo-magico/${ID}`,
  `/evento/bogue/${ID}`,
  `/evento/en-vivo/${ID}/invitados`,
  `/invitacion/${ID}`,
  `/invitacion/${ID}/rsvp`,
  `/portal-invitado/${ID}/${INVITADO.id}?token=${INVITADO.token}`,
  `/feedback/${ID}`,
];

/** Lo que maneja el equipo de AK durante la fiesta. */
const PANTALLAS_DEL_EQUIPO = [
  `/fiestas/${ID}/centro`,
  `/evento/muro-en-vivo/${ID}`,
  `/evento/en-vivo/${ID}/pantalla`,
  `/evento/en-vivo/${ID}/organizador`,
  `/evento/barra/${ID}/barman`,
  `/evento/barra/${ID}/stats`,
  // Estas dos piden sesión del equipo, no son del invitado.
  `/evento/dj/${ID}`,
  `/evento/video-vida/${ID}`,
  `/evento/logistica/${ID}`,
  `/evento/moderacion/${ID}`,
  `/evento/accesos/${ID}`,
  `/evento/impresion/${ID}`,
];

test.describe('noche de fiesta', () => {
  test('las pantallas del invitado funcionan con una fiesta real', async ({ page }) => {
    test.setTimeout(600_000);
    const problemas: Resultado[] = [];
    for (const ruta of PANTALLAS_DEL_INVITADO) {
      problemas.push(...(await revisarPantalla(page, ruta)));
    }
    expect(
      problemas,
      `Pantallas del invitado con problemas:\n  ${problemas.map((p) => `${p.ruta} → ${p.problema}`).join('\n  ')}`,
    ).toEqual([]);
  });

  test('las pantallas del equipo funcionan con una fiesta real', async ({ page, context, baseURL }) => {
    test.setTimeout(600_000);
    await context.addInitScript(() => {
      window.localStorage.setItem('ak_session', 'true');
      window.sessionStorage.setItem('ak_session', 'true');
    });
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL!, httpOnly: true, sameSite: 'Lax' },
    ]);

    const problemas: Resultado[] = [];
    for (const ruta of PANTALLAS_DEL_EQUIPO) {
      problemas.push(...(await revisarPantalla(page, ruta)));
    }
    expect(
      problemas,
      `Pantallas del equipo con problemas:\n  ${problemas.map((p) => `${p.ruta} → ${p.problema}`).join('\n  ')}`,
    ).toEqual([]);
  });
});
