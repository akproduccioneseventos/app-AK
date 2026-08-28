import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const SESSION_SECRET = 'playwright-session-secret-with-enough-entropy';

function createLegacySessionToken() {
  const payload = `v1.${Date.now() + 60 * 60 * 1000}.${crypto.randomUUID()}`;
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function findPageFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findPageFiles(entryPath);
    return entry.name === 'page.tsx' ? [entryPath] : [];
  });
}

function getStaticInternalRoutes() {
  const appRoot = path.join(process.cwd(), 'src', 'app', '(app)');
  return findPageFiles(appRoot)
    .map((file) => path.relative(appRoot, path.dirname(file)).split(path.sep))
    .filter((segments) => segments.every((segment) => !segment.startsWith('[')))
    .map((segments) => `/${segments.join('/')}`)
    .sort();
}

/** Menos de esto es una pantalla que no le dice nada al que la abre. */
const UMBRAL_PANTALLA_VACIA = 200;

/** Saca etiquetas, scripts y estilos para quedarse con lo que leeria una persona. */
function textoVisible(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

test('every static internal route responds with an authenticated session', async ({ context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-desktop', 'HTTP inventory only needs one browser project.');
  test.setTimeout(30 * 60 * 1000);

  const routes = getStaticInternalRoutes();
  expect(routes.length).toBeGreaterThanOrEqual(180);

  await context.addCookies([
    {
      name: 'ak_session',
      value: createLegacySessionToken(),
      url: testInfo.project.use.baseURL as string,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);

  const failures: string[] = [];
  for (const route of routes) {
    try {
      const response = await context.request.get(route, { timeout: 60_000 });
      const body = await response.text();
      const status = response.status();
      const finalUrl = new URL(response.url()).pathname;

      if (status >= 400) {
        failures.push(`${route}: HTTP ${status}`);
        continue;
      }
      if (finalUrl === '/login' || finalUrl === '/ingreso') {
        failures.push(`${route}: redirige a login inesperadamente`);
        continue;
      }

      // 1. Error explícito de aplicación
      if (/Application error|Internal Server Error|no puede cargar los datos del panel/i.test(body)) {
        failures.push(`${route}: muestra un error de aplicacion`);
        continue;
      }

      // 2. Extraer texto visible aproximado (removiendo tags html y scripts)
      let visibleText = textoVisible(body);

      /**
       * Si el HTML viene flaco, HAY QUE ABRIR LA PANTALLA DE VERDAD.
       *
       * Casi todas las pantallas internas se dibujan del lado del cliente: lo que
       * manda el servidor es una cascara de unos 70 caracteres, siempre igual.
       * Medir eso y cantarlo como "pantalla vacia" reporto veintipico de
       * pantallas sanas —contabilidad, clientes, empleados, calendario— en una
       * sola corrida. Una prueba que grita en falso se termina ignorando, y ahi
       * perdemos el control entero.
       *
       * Por eso se abre en el navegador **solo cuando hace falta**: si el HTML ya
       * trae contenido, alcanza con eso y la corrida sigue rapida.
       */
      if (visibleText.length < UMBRAL_PANTALLA_VACIA) {
        const pagina = await context.newPage();
        try {
          await pagina.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
          await pagina.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
          visibleText = ((await pagina.locator('body').innerText().catch(() => '')) || '')
            .replace(/\s+/g, ' ')
            .trim();
        } finally {
          await pagina.close();
        }
      }

      // 3. Pantalla prácticamente vacía, ya mirada de verdad
      if (visibleText.length < UMBRAL_PANTALLA_VACIA) {
        failures.push(`${route}: pantalla practicamente vacia (${visibleText.length} caracteres de texto)`);
      }

      // 4. Basura de programador expuesta al usuario
      if (/\b(?:NaN|\[object Object\]|\{\{)\b/.test(visibleText)) {
        failures.push(`${route}: contiene basura de programador visible`);
      }

      // 5. Plata rota ($NaN, $undefined, $ sin numero)
      if (/\$(?:NaN|undefined|\s*(?:,|\.|$))/.test(visibleText)) {
        failures.push(`${route}: muestra formato de moneda roto ($NaN o precio vacio)`);
      }
    } catch (error) {
      failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  expect(failures, failures.join('\n')).toEqual([]);
});
