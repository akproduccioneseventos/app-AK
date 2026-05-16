import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const baseUrl = process.env.AK_SMOKE_BASE_URL?.replace(/\/$/, '');

if (!baseUrl) {
  console.log('[ak-browser-smoke] Omitido: define AK_SMOKE_BASE_URL para revisar una app levantada o publicada.');
  process.exit(0);
}

async function findLocalFiestaId() {
  if (process.env.AK_SMOKE_FIESTA_ID) return process.env.AK_SMOKE_FIESTA_ID;

  const dataDir = path.join(process.cwd(), 'src', 'data', 'fiestas');
  try {
    const files = await readdir(dataDir);
    const jsonFile = files.find((file) => file.endsWith('.json'));
    if (!jsonFile) return null;

    const raw = await readFile(path.join(dataDir, jsonFile), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed?.id || jsonFile.replace(/\.json$/, '');
  } catch {
    return null;
  }
}

async function checkRoute({ label, path: routePath, allowedStatuses = [200, 204, 301, 302, 307, 308] }) {
  const url = `${baseUrl}${routePath}`;
  const response = await fetch(url, { redirect: 'manual' });
  if (!allowedStatuses.includes(response.status)) {
    throw new Error(`${label} devolvio HTTP ${response.status}: ${url}`);
  }
  console.log(`[ak-browser-smoke] OK ${label}: HTTP ${response.status}`);
}

const fiestaId = await findLocalFiestaId();
const routes = [
  { label: 'health', path: '/api/health' },
  ...(fiestaId
    ? [
        { label: 'QR publico', path: `/q/${encodeURIComponent(fiestaId)}` },
        { label: 'post-fiesta publico', path: `/post-fiesta/${encodeURIComponent(fiestaId)}` },
        {
          label: 'centro total existente',
          path: `/fiestas/nueva/centro-total?fiestaId=${encodeURIComponent(fiestaId)}`,
          allowedStatuses: [200, 204, 301, 302, 307, 308, 401, 403],
        },
      ]
    : []),
];

for (const route of routes) {
  await checkRoute(route);
}

console.log('[ak-browser-smoke] Revision basica terminada.');
