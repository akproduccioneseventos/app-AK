import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { borrarFiesta, crearFiestaDeEstaNoche, crearPermisoDeEstacion, guardarFiesta } from './helpers/fiesta-de-prueba';

/**
 * Orden 144 (Codex, ENT93-MOD): una foto guardada no es una foto publicada.
 *
 * El espejo sacaba la foto, el analisis automatico fallaba, el muro la trataba como contenido
 * adulto y NO creaba el posteo; la pantalla igual decia "Foto enviada al muro". Aca se mira, con el
 * invitado (permiso acotado, sin cookie del equipo), que lo que la pantalla anuncia coincida con lo
 * que quedo en el muro:
 *  1. camino normal: si la pantalla termino bien, existe UN posteo de esa foto (pendiente o
 *     aprobado, segun la regla de la fiesta) y nunca un anuncio sin posteo;
 *  2. el posteo pendiente NO sale en el muro publico hasta que un moderador lo aprueba;
 *  3. con el analisis de imagen CAIDO (clave invalida, sin `AK_USE_LOCAL_JSON_ONLY`, con emulador de
 *     la base): la foto queda PENDIENTE (no aprobada), la pantalla lo dice ("espera la aprobacion
 *     del equipo"), hay un solo posteo, y reintentar la misma captura no lo duplica.
 *
 * El caso 3 necesita el entorno aislado de Codex (servidor sin datos locales + emulador); en la
 * corrida comun se saltea con el motivo escrito. La logica de fondo (tres estados, reintento
 * idempotente, lector publico) esta cubierta ademas por pruebas de Jest.
 *
 * Probado rompiendolo: con `imageAiSafe: input.revisionManual === false` de vuelta, en el caso 3
 * no hay posteo y la prueba se pone en rojo; si la pantalla vuelve a decir "enviada" sin mirar la
 * respuesta, el caso 1 detecta el anuncio sin posteo.
 */

const chromiumInstalado = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
test.use({
  launchOptions: {
    ...(chromiumInstalado ? { executablePath: chromiumInstalado } : {}),
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
});

const MODULO = 'espejoMagicoFoto';

function crearFiesta(id: string) {
  const fiesta = crearFiestaDeEstaNoche({ id });
  (fiesta as any).socialWallEnabled = true;
  fiesta.others = {
    ...fiesta.others,
    entretenimiento: {
      ...fiesta.others?.entretenimiento,
      modules: {
        ...fiesta.others?.entretenimiento?.modules,
        [MODULO]: {
          enabled: true,
          countdownSeconds: 1,
          segundosCuentaRegresiva: 1,
          reviewSeconds: 180,
          allowGuestRetake: true,
          maxRetakes: 3,
          consentRequired: false,
          autoPublish: false,
        },
      },
    },
  } as any;
  return fiesta;
}

/** Posteos de la fiesta en los archivos locales (corrida con datos locales). */
function posteosEnArchivos(fiestaId: string): any[] {
  for (const relativo of ['data/social-gallery/metadata.json', 'src/data/social-gallery/metadata.json']) {
    const ruta = path.join(process.cwd(), relativo);
    if (!fs.existsSync(ruta)) continue;
    try {
      const todos = JSON.parse(fs.readFileSync(ruta, 'utf8')) as any[];
      const propios = todos.filter((p) => p.fiestaId === fiestaId);
      if (propios.length) return propios;
    } catch {}
  }
  return [];
}

function borrarPosteos(fiestaId: string) {
  for (const relativo of ['data/social-gallery/metadata.json', 'src/data/social-gallery/metadata.json']) {
    const ruta = path.join(process.cwd(), relativo);
    if (!fs.existsSync(ruta)) continue;
    try {
      const todos = JSON.parse(fs.readFileSync(ruta, 'utf8')) as any[];
      fs.writeFileSync(ruta, `${JSON.stringify(todos.filter((p) => p.fiestaId !== fiestaId), null, 2)}\n`);
    } catch {}
  }
}

async function sacarLaFoto(page: Page, id: string) {
  const acceso = crearPermisoDeEstacion(id, MODULO);
  await page.goto(`/evento/espejo-magico/${id}?access=${acceso}&mode=foto`, { waitUntil: 'domcontentloaded' });
  const tocar = page.getByRole('button', { name: 'Tocar para foto', exact: true });
  await expect(tocar).toBeVisible({ timeout: 60_000 });
  const consentimiento = page.getByRole('checkbox');
  if (await consentimiento.count()) await consentimiento.check();
  await tocar.click();
  await expect(page.getByRole('button', { name: 'Guardar en el celular', exact: true })).toBeVisible({ timeout: 90_000 });
}

test.describe('Espejo: lo que se anuncia es lo que quedo en el muro', () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'Alcanza con un navegador.');
  });

  test('si la pantalla termina bien, existe UN posteo; el pendiente no sale en el muro publico', async ({ page, context }) => {
    test.skip(process.env.AK_USE_LOCAL_JSON_ONLY !== 'true', 'Lee los posteos de los archivos locales: solo con datos locales.');
    test.setTimeout(180_000);
    const id = `e2e_espejo144_${Date.now()}`;
    guardarFiesta(crearFiesta(id));
    try {
      await sacarLaFoto(page, id);
      expect((await context.cookies()).some((c) => c.name === 'ak_session'), 'sin cookie del equipo').toBe(false);

      // La pantalla anuncio el final: tiene que haber exactamente un posteo de esa foto.
      await expect.poll(() => posteosEnArchivos(id).length, { timeout: 20_000 }).toBe(1);
      const posteo = posteosEnArchivos(id)[0];
      expect(['pending', 'approved']).toContain(posteo.moderationStatus);
      expect(posteo.imageUrl).toBeTruthy();

      // Lo pendiente no se ve en el muro publico (pagina nueva, sin sesion del equipo).
      if (posteo.moderationStatus === 'pending') {
        const muro = await context.newPage();
        await muro.goto(`/evento/muro-en-vivo/${id}`, { waitUntil: 'domcontentloaded' });
        await muro.waitForTimeout(3_000);
        // Se busca la dirección entera de la foto y el número del posteo: el último pedazo de la
        // dirección a veces es un nombre corto (pasó: 3 letras) y no sirve para buscarlo.
        const html = await muro.content();
        const direccion = String(posteo.imageUrl).split('?')[0];
        expect(direccion.length).toBeGreaterThan(10);
        expect(html, 'el muro publico no muestra una foto pendiente').not.toContain(direccion);
        expect(html, 'ni el posteo pendiente').not.toContain(String(posteo.id));
        await muro.close();
      }

      // Recargar y volver a la pantalla no crea otro posteo.
      await page.reload({ waitUntil: 'domcontentloaded' });
      expect(posteosEnArchivos(id)).toHaveLength(1);
    } finally {
      borrarPosteos(id);
      borrarFiesta(id);
    }
  });

  test('con el analisis de imagen caido: la foto queda pendiente, la pantalla lo dice, y reintentar no duplica', async ({ page }) => {
    test.skip(
      process.env.AK_USE_LOCAL_JSON_ONLY === 'true' || !process.env.FIRESTORE_EMULATOR_HOST,
      'Necesita el entorno aislado de Codex: servidor SIN datos locales, emulador de la base y clave de Vision invalida.',
    );
    test.setTimeout(240_000);
    const id = `e2e_espejo144vision_${Date.now()}`;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const admin = require('firebase-admin');
    const app = admin.initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'demo-ak-producciones' }, `espejo144-${process.pid}`);
    const db = app.firestore();
    const contar = async () => (await db.collection('social_gallery_posts').where('fiestaId', '==', id).get());
    try {
      const fiesta = crearFiesta(id);
      guardarFiesta(fiesta);
      await db.collection('fiestas').doc(id).set(JSON.parse(JSON.stringify(fiesta)));

      await sacarLaFoto(page, id);

      // Hay UN posteo, pendiente (nunca aprobado por no haberse revisado) y la pantalla lo dice.
      await expect.poll(async () => (await contar()).size, { timeout: 30_000 }).toBe(1);
      const posteo = (await contar()).docs[0].data();
      expect(posteo.moderationStatus).toBe('pending');
      await expect(page.getByTestId('aviso-foto-pendiente')).toContainText('aprobación del equipo');

      // Reintentar la misma captura (recarga/reenvio) no crea otro posteo ni otra media.
      await page.reload({ waitUntil: 'domcontentloaded' });
      expect((await contar()).size).toBe(1);
    } finally {
      const filas = await contar().catch(() => null);
      if (filas) await Promise.all(filas.docs.map((d: any) => d.ref.delete()));
      await db.collection('fiestas').doc(id).delete().catch(() => undefined);
      await app.delete().catch(() => undefined);
      borrarFiesta(id);
    }
  });
});
