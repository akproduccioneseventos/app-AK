/** @jest-environment node */
import fs from 'fs';
import path from 'path';
import { isPublicPathPrefix, PUBLIC_EXACT_PATHS } from '@/lib/auth/public-paths';

/**
 * Orden 194 / 197 — Bloque 1: El despertador pasa la puerta.
 * Todas las rutas de API que usan secretos de cron (CRON_SECRET, TAREAS_SECRET)
 * o firmas de webhook (X-Hub-Signature / X-Hub-Signature-256) deben:
 * 1. Estar declaradas como rutas públicas en public-paths (para no ser bloqueadas por la cookie de login).
 * 2. Rechazar con 401 si se invocan sin clave / sin firma válida.
 */

function isDeclaredPublic(ruta: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(ruta)) return true;
  return isPublicPathPrefix(ruta);
}

function findApiRoutes(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findApiRoutes(fullPath, fileList);
    } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe('El despertador pasa la puerta', () => {
  const root = process.cwd();
  const apiDir = path.join(root, 'src', 'app', 'api');
  const allRoutes = findApiRoutes(apiDir);

  const secretOrWebhookRoutes: { rutaRelativa: string; apiPath: string; fullPath: string }[] = [];

  for (const file of allRoutes) {
    const content = fs.readFileSync(file, 'utf8');
    if (/CRON_SECRET|TAREAS_SECRET|X-Hub-Signature|x-hub-signature/i.test(content)) {
      const rel = path.relative(path.join(root, 'src', 'app'), file).replace(/\\/g, '/');
      const apiPath = '/' + rel.replace(/\/route\.(ts|js)$/, '');
      secretOrWebhookRoutes.push({
        rutaRelativa: rel,
        apiPath,
        fullPath: file,
      });
    }
  }

  it('encuentra las rutas protegidas por cron secret o webhook signature', () => {
    expect(secretOrWebhookRoutes.length).toBeGreaterThanOrEqual(2);
    expect(secretOrWebhookRoutes.map((r) => r.apiPath)).toContain('/api/cron-despachador');
    expect(secretOrWebhookRoutes.map((r) => r.apiPath)).toContain('/api/despertar');
  });

  it('todas las rutas de cron o webhook son públicas para que el despachador no caiga en /login', () => {
    for (const route of secretOrWebhookRoutes) {
      const esPublica = isDeclaredPublic(route.apiPath);
      expect(esPublica).toBe(true);
    }
  });

  it('el cron-despachador sin clave devuelve 401', async () => {
    process.env.CRON_SECRET = 'secreto_cron_test_123';
    const { GET, POST } = await import('@/app/api/cron-despachador/route');
    const reqSinClave = new Request('http://localhost:3000/api/cron-despachador', {
      method: 'GET',
    });
    const res = await GET(reqSinClave);
    expect(res.status).toBe(401);

    const postSinClave = new Request('http://localhost:3000/api/cron-despachador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origen: 'despertador' }),
    });
    const resPost = await POST(postSinClave);
    expect(resPost.status).toBe(401);
  });

  it('despertar sin clave devuelve 401', async () => {
    process.env.CRON_SECRET = 'secreto_cron_test_123';
    const { GET, POST } = await import('@/app/api/despertar/route');
    const reqSinClave = new Request('http://localhost:3000/api/despertar', {
      method: 'GET',
    });
    const res = await GET(reqSinClave);
    expect(res.status).toBe(401);

    const postSinClave = new Request('http://localhost:3000/api/despertar', {
      method: 'POST',
    });
    const resPost = await POST(postSinClave);
    expect(resPost.status).toBe(401);
  });
});
