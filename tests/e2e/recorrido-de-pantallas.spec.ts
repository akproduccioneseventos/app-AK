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
    const routes = getAllRoutes();
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
        await page.waitForTimeout(300);

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

        // Check 4: Botón o enlace interactivo (a menos que sea pasiva)
        if (!r.passive) {
          const interactiveCount = await page.locator('button, a, input, select, textarea').count();
          if (interactiveCount === 0) {
            results.push({
              ...r,
              estado: 'FALLO',
              motivo: 'Pantalla muerta: no tiene ningún botón, enlace ni control interactivo',
              duracionMs,
            });
            page.off('pageerror', errorListener);
            continue;
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
    const rotas = results.filter((r) => r.estado === 'FALLO');
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
