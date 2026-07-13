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
      if (response.status() >= 400) failures.push(`${route}: HTTP ${response.status()}`);
      if (new URL(response.url()).pathname === '/login') failures.push(`${route}: redirige a /login`);
      if (/Application error|Internal Server Error|no puede cargar los datos del panel/i.test(body)) {
        failures.push(`${route}: muestra un error de aplicacion`);
      }
    } catch (error) {
      failures.push(`${route}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  expect(failures, failures.join('\n')).toEqual([]);
});
