// ⚠️  DEPLOY ALTERNATIVO — NO ACTIVO EN PRODUCCIÓN
//
// El camino principal de deploy es Firebase App Hosting (apphosting.yaml).
// Este archivo implementa la estrategia alternativa de Cloud Functions +
// Firebase Hosting y se mantiene solo como referencia histórica.
//
// Para reactivarlo:
//   1. Descomentar las secciones "functions" y "hosting" en firebase.json.
//   2. Ejecutar: npm run predeploy && firebase deploy --only functions,hosting
//   3. Deshabilitar (o eliminar) apphosting.yaml para evitar conflictos.
//
// Mientras App Hosting esté activo, este archivo NO se despliega.

import * as functions from 'firebase-functions';
import next from 'next';
import path from 'path';

// In production (deployed to Cloud Functions), the Next.js build
// is copied into the functions directory during the predeploy script.
// The compiled function lives in functions/lib/, so __dirname is functions/lib/
// and the .next folder is at functions/.next/ (one level up).
const nextApp = next({
  dev: false,
  dir: path.resolve(__dirname, '..'),
  conf: { distDir: '.next' },
});

const handle = nextApp.getRequestHandler();

let readyPromise: Promise<void> | null = null;

function ensureNextReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = nextApp.prepare();
  }
  return readyPromise;
}

export const nextjsServer = functions
  .runWith({
    memory: '1GB',
    timeoutSeconds: 60,
  })
  .https.onRequest(async (req, res) => {
    await ensureNextReady();

    // Capture response status for logging
    const originalEnd = res.end;
    res.end = function (...args: unknown[]) {
      const status = res.statusCode;
      if (status >= 400) {
        console.warn(`[AK] HTTP ${status} ${req.method} ${req.url}`);
      }
      return originalEnd.apply(res, args);
    };

    return handle(req, res);
  });

/**
 * Despertador de fondo de AK Producciones.
 * Corre cada 15 minutos en Google Cloud Functions de forma 100% autónoma.
 * Llama al despachador de tareas automáticas del sitio web para poner al día
 * las métricas, posteos programados, notas del blog y recordatorios vencidos,
 * sin requerir que nadie abra la aplicación ni la web.
 */
export const despertadorTareasAutomaticas = functions
  .runWith({
    timeoutSeconds: 120,
    memory: '256MB',
  })
  .pubsub.schedule('every 15 minutes')
  .timeZone('America/Montevideo')
  .onRun(async () => {
    const appUrl = process.env.APP_URL || 'https://akproducciones.uy';
    const cronSecret = process.env.CRON_SECRET || process.env.TAREAS_SECRET || '';
    const endpoint = `${appUrl}/api/cron-despachador`;

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'AK-Despertador-CloudFunctions/1.0',
        'Content-Type': 'application/json',
      };
      if (cronSecret) {
        headers['Authorization'] = `Bearer ${cronSecret}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ origen: 'despertador' }),
      });

      const body = await response.text();
      functions.logger.info(`[Despertador] Puesta al día ejecutada. Status: ${response.status}`, { body });
    } catch (err: any) {
      functions.logger.error('[Despertador] Fallo en llamada al despachador:', err?.message || err);
    }
  });

