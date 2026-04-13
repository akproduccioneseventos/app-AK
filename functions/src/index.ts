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
