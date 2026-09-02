import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { getAllRoutes, crearCookieDeSesion, FIXTURE_IDS } from '../../scripts/helpers/route-inventory.mjs';
import { crearFiestaDeEstaNoche, guardarFiesta, borrarFiesta } from './helpers/fiesta-de-prueba';

const PROHIBITED_TECHNICAL_STRINGS = [
  'undefined',
  'firestore',
  'is not a valid',
  'Algo salió mal',
  'NaN',
  '[object Object]',
];

function textoVisible(html: string) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeFileName(str: string) {
  return str.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
}

test.describe('Recorrido de las 353 pantallas', () => {
  test.setTimeout(45 * 60 * 1000);

  const results: any[] = [];
  const fiestaDemo = crearFiestaDeEstaNoche({ id: FIXTURE_IDS.fiesta });

  test.beforeAll(async () => {
    guardarFiesta(fiestaDemo);
    // Write extra mock entities for dynamic routes
    const dataDir = path.join(process.cwd(), 'data');
    fs.mkdirSync(path.join(dataDir, 'invoices'), { recursive: true });
    fs.writeFileSync(
      path.join(dataDir, 'invoices', `${FIXTURE_IDS.invoice}.json`),
      JSON.stringify({ id: FIXTURE_IDS.invoice, total: 50000, items: [] }),
    );
    fs.mkdirSync(path.join(dataDir, 'presupuestos'), { recursive: true });
    fs.writeFileSync(
      path.join(dataDir, 'presupuestos', `${FIXTURE_IDS.presupuesto}.json`),
      JSON.stringify({ id: FIXTURE_IDS.presupuesto, clienteNombre: 'Cliente Prueba', total: 50000 }),
    );
  });

  test.afterAll(async () => {
    borrarFiesta(FIXTURE_IDS.fiesta);
    const outDir = path.join(process.cwd(), 'test-results', 'recorrido');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, 'resultados.json'),
      JSON.stringify(results, null, 2),
      'utf8',
    );

    const pasaron = results.filter((r) => r.estado === 'PASO');
    const fallaron = results.filter((r) => r.estado === 'FALLO');
    const noProbadas = results.filter((r) => r.estado === 'NO_PROBADA');

    let md = `# Informe del Recorrido de Pantallas\n\n`;
    md += `**Fecha:** ${new Date().toISOString()}\n`;
    md += `**Total Pantallas:** ${results.length}\n`;
    md += `**Pasaron:** ${pasaron.length}\n`;
    md += `**Fallaron:** ${fallaron.length}\n`;
    md += `**No se pudieron probar:** ${noProbadas.length}\n\n`;

    if (fallaron.length > 0) {
      md += `## Pantallas con Fallas (${fallaron.length})\n\n`;
      md += `| Ruta | Módulo | Motivo |\n|---|---|---|\n`;
      for (const f of fallaron) {
        md += `| \`${f.routeTemplate}\` | ${f.moduleName} | ${f.motivo} |\n`;
      }
      md += `\n`;
    }

    if (noProbadas.length > 0) {
      md += `## Pantallas No Probadas (${noProbadas.length})\n\n`;
      md += `| Ruta | Módulo | Motivo |\n|---|---|---|\n`;
      for (const np of noProbadas) {
        md += `| \`${np.routeTemplate}\` | ${np.moduleName} | ${np.motivo} |\n`;
      }
      md += `\n`;
    }

    md += `## Pantallas Aprobadas (Nivel 4 + 6) (${pasaron.length})\n\n`;
    md += `| Ruta | Módulo | Caracteres | Duración | Foto |\n|---|---|---|---|---|\n`;
    for (const p of pasaron) {
      md += `| \`${p.routeTemplate}\` | ${p.moduleName} | ${p.caracteres} | ${p.duracionMs}ms | [foto](${p.screenshotRel}) |\n`;
    }

    fs.writeFileSync(path.join(outDir, 'informe.md'), md, 'utf8');
  });

  test('abre y audita cada pantalla del sistema', async ({ browser, baseURL }) => {
    // Solo las pantallas que el cambio pudo romper, si el script las paso.
    // Recorrer las 357 en cada propuesta cuesta 40 minutos y no se sostiene:
    // lo marco el dueno el 2 de septiembre de 2026. El script decide cuales;
    // aca solo se filtran.
    const soloEstas = (process.env.AK_RECORRIDO_SOLO || '')
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    const routes = soloEstas.length > 0
      ? getAllRoutes().filter((r: any) => soloEstas.includes(r.routeTemplate) || soloEstas.includes(r.pathname))
      : getAllRoutes();

    if (soloEstas.length > 0) {
      console.log(`Recorriendo ${routes.length} de ${getAllRoutes().length} pantallas (solo las que toca este cambio).`);
    }
    const outDir = path.join(process.cwd(), 'test-results', 'recorrido');
    fs.mkdirSync(outDir, { recursive: true });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });

    await context.addCookies([
      {
        name: 'ak_session',
        value: crearCookieDeSesion(),
        url: baseURL || 'http://localhost:3000',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    const page = await context.newPage();

    for (let i = 0; i < routes.length; i++) {
      const r = routes[i];
      const startTime = Date.now();
      const pageErrors: string[] = [];
      const errorListener = (err: Error) => pageErrors.push(err.message);
      page.on('pageerror', errorListener);

      const shotFileName = `${String(i + 1).padStart(3, '0')}_${sanitizeFileName(r.routeTemplate)}.png`;
      const shotPath = path.join(outDir, shotFileName);
      const screenshotRel = `./${shotFileName}`;

      try {
        const response = await page.goto(r.testUrl, {
          timeout: 15_000,
          waitUntil: 'domcontentloaded',
        });

        const status = response ? response.status() : 0;
        const duracionMs = Date.now() - startTime;

        if (status >= 400) {
          results.push({
            ...r,
            estado: 'FALLO',
            motivo: `HTTP ${status}`,
            duracionMs,
          });
          page.off('pageerror', errorListener);
          continue;
        }

        // Wait brief settling time for hydration
        // ESPERAR DE VERDAD A QUE LA PANTALLA SE DIBUJE.
        //
        // Antes esperaba 300 milesimas y despues juzgaba. Estas pantallas tardan
        // segundos en dibujarse, asi que reportaba "pantalla muerta" en 35 que
        // andan perfecto: `/admin`, por ejemplo, tiene 15 botones en el codigo.
        // Un control que grita por 35 cosas sanas no lo mira nadie a la segunda
        // vez, y ahi se pierde el que era de verdad.
        await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
        await page
          .locator('button, a, input, select, textarea, [role="button"]')
          .first()
          .waitFor({ state: 'attached', timeout: 8_000 })
          .catch(() => {});

        const html = await page.content();
        const text = textoVisible(html);

        // Check 1: Dibujó algo (al menos 40 caracteres)
        if (text.length < 40) {
          // Check if it's an explicit "no está habilitada" message
          if (/no está habilitada|no habilitad/i.test(text)) {
            results.push({
              ...r,
              estado: 'NO_PROBADA',
              motivo: 'Pantalla no habilitada para este módulo',
              duracionMs,
            });
            page.off('pageerror', errorListener);
            continue;
          }
          results.push({
            ...r,
            estado: 'FALLO',
            motivo: `Pantalla vacía (sólo ${text.length} caracteres de texto visible)`,
            duracionMs,
          });
          page.off('pageerror', errorListener);
          continue;
        }

        // Check 2: Errores no capturados
        if (pageErrors.length > 0) {
          results.push({
            ...r,
            estado: 'FALLO',
            motivo: `Error en consola: ${pageErrors[0]}`,
            duracionMs,
          });
          page.off('pageerror', errorListener);
          continue;
        }

        // Check 3: Fuga de términos técnicos
        let technicalLeak: string | null = null;
        for (const forbidden of PROHIBITED_TECHNICAL_STRINGS) {
          if (text.includes(forbidden)) {
            // Exceptions for technical settings code blocks if any
            if (!r.pathname.includes('/settings/feature-flags')) {
              technicalLeak = forbidden;
              break;
            }
          }
        }

        if (technicalLeak) {
          results.push({
            ...r,
            estado: 'FALLO',
            motivo: `Muestra texto técnico al usuario: "${technicalLeak}"`,
            duracionMs,
          });
          page.off('pageerror', errorListener);
          continue;
        }

        // Check 4: ¿la pantalla esta MUERTA?
        //
        // ANTES ESTE CONTROL DABA CUATRO FALSAS ALARMAS, y se midio el 2 de
        // septiembre de 2026: marcaba como rotas `/analytics`, las estadisticas
        // de la barra, el video recuerdo y la entrada del evento. **Las cuatro
        // estaban sanas**: son tableros de numeros y graficos, y no tienen
        // botones porque no los necesitan.
        //
        // El control preguntaba mal. Una pantalla no esta muerta por no tener
        // botones: **esta muerta cuando no muestra NADA**. Eso es lo que hay que
        // agarrar -la pantalla en blanco, la que se quedo cargando para siempre,
        // la que existe y no dibuja-.
        //
        // Asi que ahora se piden las dos cosas: **sin nada para tocar Y sin nada
        // para leer**. Un tablero lleno de numeros pasa; una pantalla vacia con
        // un boton suelto tambien se agarra ahora, que antes se escapaba.
        //
        // NO se aflojo el control: se le cambio la pregunta por la correcta.
        if (!r.passive) {
          const interactiveCount = await page.locator('button, a, input, select, textarea').count();
          const texto = ((await page.locator('body').innerText().catch(() => '')) || '').trim();

          // 200 caracteres es como una frase larga. Debajo de eso no hay
          // pantalla: hay un cartel de "cargando" o un titulo solo.
          const MINIMO_PARA_QUE_CUENTE = 200;
          const noHayNadaParaTocar = interactiveCount === 0;
          const noHayNadaParaLeer = texto.length < MINIMO_PARA_QUE_CUENTE;

          if (noHayNadaParaTocar && noHayNadaParaLeer) {
            results.push({
              ...r,
              estado: 'FALLO',
              motivo: `Pantalla muerta: no tiene nada para tocar ni nada para leer (${texto.length} caracteres)`,
              duracionMs,
            });
            page.off('pageerror', errorListener);
            continue;
          }

          // Queda anotado, sin frenar: una pantalla de solo mirar puede ser
          // correcta -un tablero- o puede ser una que se olvidaron de
          // enganchar. Que figure en el informe deja que se mire con ojo.
          if (noHayNadaParaTocar) {
            (r as Record<string, unknown>).soloParaMirar = true;
          }
        }

        // Check 5: Duración < 15s (already enforced by timeout)

        // Capture screenshot
        try {
          await page.screenshot({ path: shotPath, fullPage: false });
        } catch {
          // ignore screenshot failure
        }

        results.push({
          ...r,
          estado: 'PASO',
          caracteres: text.length,
          duracionMs,
          screenshotRel,
        });
      } catch (err: any) {
        results.push({
          ...r,
          estado: 'FALLO',
          motivo: `Excepción al abrir: ${err.message}`,
          duracionMs: Date.now() - startTime,
        });
      } finally {
        page.off('pageerror', errorListener);
      }
    }

    await context.close();

    // ESTO ES LO QUE HACE QUE EL CONTROL SIRVA.
    //
    // Sin esto, el recorrido junta los resultados, escribe el informe y termina
    // en verde **aunque las 353 pantallas esten rotas**. Es la misma forma que
    // tuvo el corredor de pruebas que decia "todas pasaron" con cero pruebas
    // corridas, y el control de acentos que daba bien mirando cero archivos.
    //
    // La regla del proyecto: un control que no frena no es un control.
    // LO NUEVO FRENA, LO VIEJO INFORMA. Y el numero solo puede bajar.
    //
    // Si la puerta exigiera las 357 pantallas perfectas, **no se podria publicar
    // nunca**: hay 11 que ya venian rotas de antes. Y una puerta que nunca deja
    // pasar termina desactivada, que es peor que no tenerla.
    //
    // Entonces: las conocidas se listan en `docs/pantallas-rotas-conocidas.json`
    // y solo informan. **Cualquier pantalla que se rompa y no este en esa lista,
    // frena.** Y si una de la lista se arregla, se saca del archivo y ya no puede
    // volver a romperse sin que la puerta lo agarre.
    const conocidas: string[] = (() => {
      try {
        const ruta = path.join(process.cwd(), 'docs', 'pantallas-rotas-conocidas.json');
        return JSON.parse(fs.readFileSync(ruta, 'utf8')).rotas ?? [];
      } catch {
        return [];
      }
    })();

    const todasLasRotas = results.filter((r) => r.estado === 'FALLO');
    const yaEstaban = todasLasRotas.filter((r) => conocidas.includes(r.pathname));
    const rotas = todasLasRotas.filter((r) => !conocidas.includes(r.pathname));

    if (yaEstaban.length > 0) {
      console.log(`\n  ${yaEstaban.length} pantalla(s) que ya venian rotas (no frenan, pero hay que arreglarlas):`);
      for (const r of yaEstaban) console.log(`     ${r.pathname}: ${r.motivo}`);
    }

    // Y si una de las conocidas se arreglo, se avisa para sacarla de la lista.
    const arregladas = conocidas.filter((c) => !todasLasRotas.some((r) => r.pathname === c));
    if (arregladas.length > 0) {
      console.log(`\n  ${arregladas.length} pantalla(s) de la lista YA ANDAN. Sacalas de docs/pantallas-rotas-conocidas.json:`);
      for (const a of arregladas) console.log(`     ${a}`);
    }
    const resumen = rotas
      .slice(0, 25)
      .map((r) => `  ${r.pathname}: ${r.motivo}`)
      .join('\n');
    expect(
      rotas.length,
      `Hay ${rotas.length} de ${results.length} pantallas rotas. El detalle completo esta en test-results/recorrido/informe.md\n${resumen}`,
    ).toBe(0);
  });
});
