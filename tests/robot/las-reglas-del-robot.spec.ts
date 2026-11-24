import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import {
  crearPermisoDeEstacion,
  FIXTURE_IDS,
  getAllRoutes,
} from '../../scripts/helpers/route-inventory.mjs';
import { ponerSesionDelEquipo } from '../e2e/helpers/fiesta-de-prueba';
import { esErrorDelArmazonAlRedirigir } from '../e2e/helpers/errores-que-no-son-de-la-app';
import {
  ROBOT_FIESTA_A_ID,
  ROBOT_FIESTA_A_NOMBRE,
  ROBOT_FIESTA_B_ID,
  ROBOT_FIESTA_B_NOMBRE,
  ROBOT_MENU_BORRADOR_NOMBRE,
  ROBOT_SERVICIO_BORRADOR_NOMBRE,
  sembrarRobot,
} from './sembrar';
import {
  ejecutarReglaAgregarYCancelar,
  ejecutarReglaDescargasPdf,
  ejecutarReglaIdaYVuelta,
  ejecutarReglaLecturaFallidaNoEsCero,
  ejecutarReglaPublicoSinBorradores,
  ejecutarReglaVolverNoPierde,
  evaluarContexto,
  evaluarNoSeCae,
  leerTextoYLinks,
  REGLAS_ROBOT,
  type NombreReglaRobot,
  type ResultadoRegla,
} from './reglas';

interface RegistroRutaRobot {
  routeTemplate: string;
  pathname: string;
  moduleName: string;
  reglas: Record<NombreReglaRobot, ResultadoRegla>;
  fallas: Array<{
    ruta: string;
    regla: NombreReglaRobot;
    elemento: string;
    motivo: string;
    contextoFiesta?: string;
  }>;
  actualizadoEn: string;
}

const DIR_ROBOT = path.join(process.cwd(), 'test-results', 'robot');
const DIR_PARCIALES = path.join(DIR_ROBOT, 'parciales');
const ARCHIVO_RESULTADOS = path.join(DIR_ROBOT, 'resultados.json');

function sanitizeNombre(str: string): string {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || 'root';
}

function esRutaDeFiesta(ruta: { routeTemplate: string; testUrl: string }): boolean {
  return (
    ruta.testUrl.includes(FIXTURE_IDS.fiesta) ||
    ruta.routeTemplate.includes('[fiestaId]') ||
    ruta.routeTemplate.includes('/fiestas/[id]')
  );
}

function armarUrlParaFiesta(
  ruta: { routeTemplate: string; pathname: string; testUrl: string },
  fiestaId: string,
): string {
  let url = ruta.testUrl.split(FIXTURE_IDS.fiesta).join(fiestaId);
  if (ruta.pathname.startsWith('/evento/')) {
    const match = ruta.pathname.match(/\/evento\/([^/]+)/);
    const moduloId = match ? match[1] : 'fotocabina';
    const permiso = crearPermisoDeEstacion(fiestaId, moduloId);
    url = url.replace(/([?&])access=[^&]+/, `$1access=${permiso}`);
  }
  return url;
}

function combinarResultadosRegla(actual: ResultadoRegla, nuevo: ResultadoRegla): ResultadoRegla {
  if (actual.estado === 'rojo') return actual;
  if (nuevo.estado === 'rojo') return nuevo;
  if (nuevo.estado === 'verde') return nuevo;
  return actual;
}

function consolidarResultados(): void {
  fs.mkdirSync(DIR_ROBOT, { recursive: true });
  if (!fs.existsSync(DIR_PARCIALES)) return;
  const archivos = fs.readdirSync(DIR_PARCIALES).filter((f) => f.endsWith('.json'));
  const registros: RegistroRutaRobot[] = [];
  for (const archivo of archivos) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(DIR_PARCIALES, archivo), 'utf8'));
      registros.push(data);
    } catch {
      // ignorar parcial corrupto
    }
  }
  try {
    const tmpFile = path.join(DIR_ROBOT, `resultados.${process.pid}.${Date.now()}.tmp`);
    fs.writeFileSync(tmpFile, JSON.stringify(registros, null, 2) + '\n', 'utf8');
    fs.renameSync(tmpFile, ARCHIVO_RESULTADOS);
  } catch {
    // ignorar conflicto de concurrencia de renombrado
  }
}

function cargarRutasFiltradas() {
  const todas = getAllRoutes() as Array<{
    routeTemplate: string;
    pathname: string;
    testUrl: string;
    type: string;
    moduleName: string;
  }>;
  const filtroRaw = (process.env.ROBOT_RUTAS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (filtroRaw.length === 0) return todas;
  return todas.filter((r) => filtroRaw.includes(r.routeTemplate) || filtroRaw.includes(r.pathname));
}

const rutas = cargarRutasFiltradas();

test.describe('Auditor Robot — 8 reglas de comportamiento', () => {
  test.describe.configure({ mode: 'parallel' });
  test.setTimeout(120_000);

  test.beforeAll(async () => {
    fs.mkdirSync(DIR_PARCIALES, { recursive: true });
    if (process.env.FIRESTORE_EMULATOR_HOST && process.env.PLAYWRIGHT_ROBOT_EMULATOR !== 'true') {
      await sembrarRobot();
    }
  });

  test.afterAll(() => {
    consolidarResultados();
  });

  for (const ruta of rutas) {
    test(`audita ${ruta.routeTemplate}`, async ({ browser, baseURL }) => {
      const origin = (baseURL || 'http://127.0.0.1:3100').replace(/\/$/, '');
      const llevaFiesta = esRutaDeFiesta(ruta);
      const escenarios = llevaFiesta
        ? [
            {
              fiestaId: ROBOT_FIESTA_A_ID,
              esperada: ROBOT_FIESTA_A_NOMBRE,
              otra: ROBOT_FIESTA_B_NOMBRE,
            },
            {
              fiestaId: ROBOT_FIESTA_B_ID,
              esperada: ROBOT_FIESTA_B_NOMBRE,
              otra: ROBOT_FIESTA_A_NOMBRE,
            },
          ]
        : [
            {
              fiestaId: undefined,
              esperada: undefined,
              otra: undefined,
            },
          ];

      const reglas: Record<NombreReglaRobot, ResultadoRegla> = {
        contexto: { estado: 'sin-mirar' },
        'no-se-cae': { estado: 'sin-mirar' },
        'ida-y-vuelta': { estado: 'sin-mirar' },
        'agregar-y-cancelar': { estado: 'sin-mirar' },
        'volver-no-pierde': { estado: 'sin-mirar' },
        'descargas-pdf': { estado: 'sin-mirar' },
        'publico-sin-borradores': { estado: 'sin-mirar' },
        'lectura-fallida-no-es-cero': { estado: 'sin-mirar' },
      };
      const fallas: RegistroRutaRobot['fallas'] = [];

      const registrar = (
        regla: NombreReglaRobot,
        res: ResultadoRegla,
        contextoFiesta?: string,
      ) => {
        reglas[regla] = combinarResultadosRegla(reglas[regla], res);
        if (res.estado === 'rojo') {
          fallas.push({
            ruta: ruta.routeTemplate,
            regla,
            elemento: res.elemento || 'desconocido',
            motivo: res.motivo || 'Falla sin detalle',
            ...(contextoFiesta ? { contextoFiesta } : {}),
          });
        }
      };

      for (const esc of escenarios) {
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
        if (ruta.type !== 'public') {
          await ponerSesionDelEquipo(context, origin);
        }
        const page = await context.newPage();
        const pageErrors: string[] = [];
        const consoleErrors: string[] = [];

        const onPageError = (err: Error) => {
          if (!esErrorDelArmazonAlRedirigir(err.message)) pageErrors.push(err.message);
        };
        const onConsole = (msg: import('@playwright/test').ConsoleMessage) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        };
        page.on('pageerror', onPageError);
        page.on('console', onConsole);

        const targetPath = esc.fiestaId ? armarUrlParaFiesta(ruta, esc.fiestaId) : ruta.testUrl;
        const fullUrl = `${origin}${targetPath}`;

        try {
          await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
          await page.waitForLoadState('networkidle', { timeout: 2_500 }).catch(() => {});
          await page.waitForTimeout(400);

          const { textoVisible, hrefs } = await leerTextoYLinks(page);

          // Regla 1: Contexto
          registrar(
            'contexto',
            evaluarContexto({
              textoVisible,
              hrefs,
              fiestaEsperadaNombre: esc.esperada,
              otraFiestaNombre: esc.otra,
              exigirFiestaEsperada: Boolean(esc.fiestaId && ruta.type === 'app'),
            }),
            esc.esperada,
          );

          // Regla 2: No se cae
          registrar(
            'no-se-cae',
            evaluarNoSeCae({ textoVisible, consoleErrors, pageErrors }),
            esc.esperada,
          );

          // Las reglas de mutación/navegación corren una vez por ruta (sobre Fiesta A si aplica).
          if (!esc.fiestaId || esc.fiestaId === ROBOT_FIESTA_A_ID) {
            // Regla 4: Agregar y cancelar (antes de editar)
            registrar('agregar-y-cancelar', await ejecutarReglaAgregarYCancelar(page), esc.esperada);

            // Regla 3: Ida y vuelta
            registrar('ida-y-vuelta', await ejecutarReglaIdaYVuelta(page, fullUrl), esc.esperada);

            // Regla 5: Volver no pierde
            registrar('volver-no-pierde', await ejecutarReglaVolverNoPierde(page, ruta.pathname), esc.esperada);

            // Regla 6: Descargas PDF
            registrar('descargas-pdf', await ejecutarReglaDescargasPdf(page), esc.esperada);

            // Regla 8: Lectura fallida no es cero
            registrar(
              'lectura-fallida-no-es-cero',
              await ejecutarReglaLecturaFallidaNoEsCero(page, fullUrl, ruta.pathname),
              esc.esperada,
            );
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          registrar(
            'no-se-cae',
            { estado: 'rojo', elemento: 'navegacion', motivo: `Error abriendo ${targetPath}: ${msg}` },
            esc.esperada,
          );
        } finally {
          page.off('pageerror', onPageError);
          page.off('console', onConsole);
          await context.close().catch(() => {});
        }
      }

      // Regla 7: Lo público sin borradores ni fiesta de muestra (sin sesión)
      registrar(
        'publico-sin-borradores',
        await ejecutarReglaPublicoSinBorradores(browser, origin, ruta.testUrl, ruta.pathname, {
          borradoresProhibidos: [ROBOT_MENU_BORRADOR_NOMBRE, ROBOT_SERVICIO_BORRADOR_NOMBRE],
          muestrasProhibidas: ['DEMO AK', 'fiesta_muestra_auditor', 'XV Martina'],
        }),
      );

      for (const regla of REGLAS_ROBOT) {
        if (reglas[regla].estado === 'sin-mirar') {
          reglas[regla] = { estado: 'verde' };
        }
      }

      const registro: RegistroRutaRobot = {
        routeTemplate: ruta.routeTemplate,
        pathname: ruta.pathname,
        moduleName: ruta.moduleName,
        reglas,
        fallas,
        actualizadoEn: new Date().toISOString(),
      };

      fs.mkdirSync(DIR_PARCIALES, { recursive: true });
      fs.writeFileSync(
        path.join(DIR_PARCIALES, `${sanitizeNombre(ruta.routeTemplate)}.json`),
        JSON.stringify(registro, null, 2) + '\n',
        'utf8',
      );
      consolidarResultados();

      if (process.env.ROBOT_FAIL_ON_RED === 'true') {
        expect(
          fallas,
          `El auditor robot encontró ${fallas.length} falla(s) en ${ruta.routeTemplate}:\n` +
            fallas.map((f) => `  - [${f.regla}] ${f.elemento}: ${f.motivo}`).join('\n'),
        ).toEqual([]);
      }
    });
  }
});
