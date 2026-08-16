import { expect, test, type Page } from '@playwright/test';
import { borrarFiesta, crearCookieDeSesion, crearFiestaDeEstaNoche, crearPermisoDeEstacion, leerFiesta, borrarOpinionesDePrueba } from './helpers/fiesta-de-prueba';

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

/**
 * Fiesta señuelo, agendada para dentro de un año.
 *
 * Varias pantallas cargaban "la fiesta actual" (la de fecha más próxima entre
 * todas) en vez de la del enlace. Con una sola fiesta cargada eso funcionaba de
 * casualidad y ninguna prueba lo veía. Con esta señuelo por delante, cualquier
 * pantalla que vuelva a caer en la trampa falla enseguida.
 */
/**
 * 400 días y no 365, a propósito: la prueba del simulador avanza doce meses en
 * el calendario y elige el día 15, que a un año justo caía exactamente en esta
 * señuelo. El simulador la veía como fecha ocupada —bien, porque lo estaba— y
 * no dejaba pasar de paso. Dos pruebas peleando por la misma fecha, sin que
 * ninguna estuviera mal. Con 400 días quedan en meses distintos.
 */
const SENUELO = crearFiestaDeEstaNoche({
  id: `${ID}_senuelo`,
  fechaEvento: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
});

test.afterAll(() => {
  borrarFiesta(SENUELO.id);
  if (!process.env.AK_E2E_ID) borrarFiesta(ID);
  // La opinión de prueba se guarda de verdad, así que hay que sacarla: si no,
  // queda mezclada con las opiniones reales de los clientes.
  borrarOpinionesDePrueba();
});

/** Textos que delatan que la pantalla no encontró con qué trabajar. */
const SENALES_DE_FALLA = [
  /no se encontr/i,
  /no encontr[ée]/i,
  /evento no encontrado/i,
  /fiesta no encontrada/i,
  // La encuesta rechazaba su propio enlace diciendo esto.
  /no corresponde al evento/i,
  /enlace (invalido|inválido|vencido)/i,
  /application error/i,
  /something went wrong/i,
  /internal server error/i,
  /experiencia no disponible/i,
  /este acceso no es válido/i,
  /acceso (denegado|restringido|no autorizado)/i,
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
  } else if (respuesta.status() >= 400) {
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
  `/evento/social/${ID}?guestId=${INVITADO.id}&token=${INVITADO.token}`,
  `/evento/social/${ID}?estacion=totems&access=${crearPermisoDeEstacion(ID, 'totems')}`,
  `/evento/galeria/${ID}`,
  `/evento/barra/${ID}`,
  `/evento/zona-digital/${ID}`,
  // Las estaciones se abren con el permiso que lleva el QR del salón, igual que
  // en una fiesta real. Sin él la app tiene que negar el acceso, no fallar.
  `/evento/buzon/${ID}?access=${crearPermisoDeEstacion(ID, 'capsulaTiempo')}`,
  `/evento/fotocabina/${ID}?access=${crearPermisoDeEstacion(ID, 'fotocabina')}`,
  `/evento/plataforma-360/${ID}?access=${crearPermisoDeEstacion(ID, 'plataforma360')}`,
  `/evento/touchpix/${ID}?access=${crearPermisoDeEstacion(ID, 'espejoMagicoIA')}`,
  `/evento/espejo-magico/${ID}?access=${crearPermisoDeEstacion(ID, 'espejoMagicoFirma')}`,
  `/evento/bogue/${ID}?access=${crearPermisoDeEstacion(ID, 'bogue')}`,
  `/evento/en-vivo/${ID}/invitados`,
  `/invitacion/${ID}`,
  `/invitacion/${ID}/rsvp`,
  `/portal-invitado/${ID}/${INVITADO.id}?token=${INVITADO.token}`,
  `/feedback/${ID}`,
  // La familia sube acá las fotos del video de vida.
  `/video-vida/${ID}`,
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
    test.setTimeout(900_000);
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
    test.setTimeout(900_000);
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

  test('el control de entrada marca el ingreso de un invitado', async ({ page, context, baseURL }) => {
    test.setTimeout(180_000);
    await context.addInitScript(() => {
      window.localStorage.setItem('ak_session', 'true');
      window.sessionStorage.setItem('ak_session', 'true');
    });
    await context.addCookies([
      { name: 'ak_session', value: crearCookieDeSesion(), url: baseURL!, httpOnly: true, sameSite: 'Lax' },
    ]);

    // Esto es lo que pasa cuando en la puerta se escanea el QR de una invitada.
    await page.goto(`/evento/actual/checkin?fiestaId=${ID}&guestId=${INVITADO.id}`, { waitUntil: 'domcontentloaded' });

    await expect(page.getByText(/Lucía Fernández/)).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(/no corresponde|no encontramos/i)).toHaveCount(0);

    // Y tiene que quedar registrado en la fiesta, no sólo mostrarse en pantalla.
    await expect(async () => {
      const guardado = leerFiesta(ID);
      const invitado = (guardado?.invitados ?? []).find((i: any) => i.id === INVITADO.id);
      expect(invitado?.checkedIn, 'La entrada no quedó registrada').toBe(true);
    }).toPass({ timeout: 30_000 });
  });

  test('el invitado deja su opinión y queda registrada', async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto(`/feedback/${ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Enviar Mis Comentarios/i })).toBeVisible({ timeout: 45_000 });

    await page.getByRole('button', { name: '9', exact: true }).click();
    await page.locator('#client-name').fill('Lucía Fernández');
    await page.locator('#enjoyed-most').fill('La barra y la pantalla del salón.');
    await page.locator('#to-improve').fill('Más variedad de postres.');
    await page.getByRole('button', { name: /Enviar Mis Comentarios/i }).click();

    // Tiene que confirmar en pantalla: si el envío falla en silencio, el invitado
    // se va creyendo que opinó y AK nunca se entera.
    await expect(page.getByText(/gracias/i).first()).toBeVisible({ timeout: 45_000 });
  });
});
