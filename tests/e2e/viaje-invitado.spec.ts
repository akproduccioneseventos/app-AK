import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { buildAkDemoFiesta } from '../../src/lib/experience-ak/demo-fiesta-factory';

/**
 * Viaje completo del invitado, con datos de verdad.
 *
 * Hasta ahora las pruebas de navegador comprobaban que las pantallas *abren*.
 * Esta comprueba que *funcionan*: crea un evento real, entra como invitado,
 * confirma la asistencia y despues verifica que la confirmacion quedo guardada
 * y que el equipo la ve en la pantalla de la fiesta.
 *
 * Como funciona sin base de datos:
 * la app tiene un modo local (`AK_USE_LOCAL_JSON_ONLY`) que lee y escribe los
 * eventos como archivos. Con `AK_ALLOW_LOCAL_JSON_WRITES` habilitado, el
 * guardado ocurre de verdad, asi que el recorrido es el mismo que en produccion
 * salvo por donde termina el dato.
 *
 * Lo que esta prueba NO cubre: subir una foto al muro. Esa parte escribe en
 * Firebase Storage, que no existe en este entorno.
 */

const NOMBRE_INVITADO = 'Prueba Invitado E2E';
const CLAVE_PORTAL = 'clave-de-prueba-e2e';
const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';

function createSessionToken() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  return `${payload}.${crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')}`;
}

/** El evento se escribe en las dos rutas donde la app busca los datos locales. */
const CARPETAS_DATOS = [
  path.join(process.cwd(), 'data', 'fiestas'),
  path.join(process.cwd(), 'src', 'data', 'fiestas'),
];

const fiesta = (() => {
  const base = buildAkDemoFiesta('xv');
  return {
    ...base,
    id: `e2e_invitado_${Date.now()}`,
    invitados: [],
    configuracion: { ...base.configuracion, nombreEvento: 'Fiesta de prueba automatica' },
    clientPortalSettings: { ...base.clientPortalSettings, enabled: true, accessKey: CLAVE_PORTAL },
  };
})();

function archivosDelEvento() {
  return CARPETAS_DATOS.map((dir) => path.join(dir, `${fiesta.id}.json`));
}

function leerEventoGuardado() {
  for (const archivo of archivosDelEvento()) {
    if (fs.existsSync(archivo)) {
      return JSON.parse(fs.readFileSync(archivo, 'utf8'));
    }
  }
  return null;
}

test.beforeAll(() => {
  for (const archivo of archivosDelEvento()) {
    fs.mkdirSync(path.dirname(archivo), { recursive: true });
    fs.writeFileSync(archivo, `${JSON.stringify(fiesta, null, 2)}\n`);
  }
});

test.afterAll(() => {
  for (const archivo of archivosDelEvento()) {
    if (fs.existsSync(archivo)) fs.unlinkSync(archivo);
  }
});

test.describe('viaje del invitado', () => {
  test('confirma, recibe su QR y la confirmacion llega al evento', async ({ page }) => {
    test.setTimeout(180_000);

    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));

    // 1. El invitado abre el enlace que le llego por WhatsApp.
    await page.goto(`/invitacion/${fiesta.id}/rsvp`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Confirmar asistencia' })).toBeVisible({ timeout: 45_000 });

    // 2. Completa el formulario como lo haria una persona.
    await page.locator('#nombre').fill(NOMBRE_INVITADO);
    await page.locator('#contacto').fill('099 111 222');
    await page.getByRole('button', { name: '✅ Sí, voy!' }).click();

    // Va con dos acompanantes: son tres personas, no una fila.
    const sumarPersona = page.getByRole('button', { name: '+', exact: true });
    await sumarPersona.click();
    await sumarPersona.click();

    await page.getByPlaceholder('Acompañante 1').fill('Acompañante Uno');
    await page.getByPlaceholder('Canción 1 – Artista').fill('Perfect – Ed Sheeran');

    await page.getByRole('button', { name: 'Confirmar asistencia' }).click();

    // 3. Tiene que ver su entrada, no un error.
    await expect(page.getByTestId('guest-qr-container')).toBeVisible({ timeout: 45_000 });

    // El QR tiene que estar dibujado de verdad, no ser un recuadro en blanco.
    const qrDibujado = await page.evaluate(() => {
      const canvas = document.getElementById('qr-rsvp-guest') as HTMLCanvasElement | null;
      if (!canvas || !canvas.width) return { ok: false, motivo: 'no hay canvas' };
      const ctx = canvas.getContext('2d');
      if (!ctx) return { ok: false, motivo: 'sin contexto de dibujo' };
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let oscuros = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 128 && data[i + 3] > 0) oscuros += 1;
      }
      const total = data.length / 4;
      return { ok: oscuros > total * 0.05, motivo: `${oscuros} de ${total} puntos oscuros` };
    });
    expect(qrDibujado.ok, `El QR salio vacio: ${qrDibujado.motivo}`).toBe(true);

    // El boton de descarga tiene que estar y ser clickeable.
    await expect(page.getByRole('button', { name: /Descargar/i })).toBeEnabled();

    // 4. Lo importante: la confirmacion quedo guardada en el evento.
    await expect(async () => {
      const guardado = leerEventoGuardado();
      const invitado = (guardado?.invitados ?? []).find((i: any) => i.nombre === NOMBRE_INVITADO);
      expect(invitado, 'La confirmacion no llego al evento').toBeTruthy();
      expect(invitado.rsvp).toBe('Confirmado');
      expect(invitado.partySize).toBe(3);
      expect(invitado.contacto).toBe('099 111 222');
      expect(invitado.cancionesDJ).toContain('Perfect – Ed Sheeran');
      // Guardar la confirmacion no puede borrarle la clave del portal al
      // cliente que contrato la fiesta. Paso de verdad: el primer invitado que
      // confirmaba lo dejaba afuera de su propio portal.
      expect(
        guardado?.clientPortalSettings?.accessKey,
        'La confirmacion del invitado borro la clave del portal del cliente',
      ).toBe(CLAVE_PORTAL);
    }).toPass({ timeout: 30_000 });

    expect(errores, `La invitacion tuvo fallas de JavaScript:\n${errores.join('\n')}`).toEqual([]);
  });

  test('el que no puede ir ve el boton correcto', async ({ page }) => {
    await page.goto(`/invitacion/${fiesta.id}/rsvp`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: 'Confirmar asistencia' })).toBeVisible({ timeout: 45_000 });

    await page.getByRole('button', { name: '❌ No puedo ir' }).click();

    // El boton cambia de texto: no puede decirle "confirmar asistencia" a
    // alguien que acaba de decir que no va.
    await expect(page.getByRole('button', { name: 'Confirmar cancelación' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirmar asistencia' })).toHaveCount(0);
  });

  test('el equipo ve la confirmacion en el centro de fiesta', async ({ page, context, baseURL }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('ak_session', 'true');
      window.sessionStorage.setItem('ak_session', 'true');
    });
    await context.addCookies([
      { name: 'ak_session', value: createSessionToken(), url: baseURL!, httpOnly: true, sameSite: 'Lax' },
    ]);

    // Antes de mirar la pantalla: el dato tiene que seguir en el evento. Si esto
    // falla, el problema es el guardado, no la pantalla.
    const guardado = leerEventoGuardado();
    expect(
      (guardado?.invitados ?? []).map((i: any) => i.nombre),
      'El invitado desaparecio del evento entre una pantalla y otra',
    ).toContain(NOMBRE_INVITADO);

    await page.goto(`/fiestas/${fiesta.id}/centro`, { waitUntil: 'domcontentloaded' });

    // El invitado dijo que venian tres personas: el centro tiene que contar
    // personas, no filas de la lista.
    await expect(page.getByTestId('centro-confirmadas')).toHaveText('3', { timeout: 45_000 });
    await expect(page.getByRole('heading', { name: 'Fiesta de prueba automatica' })).toBeVisible();
  });

  test('el cliente entra a su portal con su clave y ve a su invitado', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto(`/portal-cliente/${fiesta.id}`, { waitUntil: 'domcontentloaded' });

    const clave = page.locator('input[type="password"]');
    await expect(clave).toBeVisible({ timeout: 45_000 });
    await clave.fill(CLAVE_PORTAL);
    await page.getByRole('button', { name: /Ingresar/i }).click();

    // Con la clave correcta tiene que entrar, no quedarse en la pantalla de clave.
    await expect(clave).toHaveCount(0, { timeout: 45_000 });

    // En la pestana de invitados tiene que aparecer quien confirmo, con su
    // cantidad de personas.
    await page.getByRole('tab', { name: 'Invitados' }).click();
    await expect(page.getByText(NOMBRE_INVITADO).first()).toBeVisible({ timeout: 45_000 });

    // Y el saldo tiene que verse sin abrir acordeones.
    await page.getByRole('tab', { name: 'Pagos' }).click();
    await expect(page.getByText(/Saldo/i).first()).toBeVisible({ timeout: 45_000 });
  });
});
