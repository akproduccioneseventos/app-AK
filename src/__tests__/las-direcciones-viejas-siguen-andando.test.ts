import fs from 'fs';
import path from 'path';
import { NO_SE_ENLAZAN } from '../../src/lib/navegacion/mapa';

jest.mock('@ducanh2912/next-pwa', () => ({
  __esModule: true,
  default: () => (config: any) => config,
}));

import nextConfig from '../../next.config.js';

const PAGE_FILES = ['page.tsx', 'page.ts', 'page.jsx', 'page.js'];

function recolectarPatronesDePaginas(appDir: string): string[][] {
  const rutas: string[][] = [];

  function recorrer(dir: string, segmentos: string[]) {
    const entradas = fs.readdirSync(dir, { withFileTypes: true });
    if (entradas.some((e) => e.isFile() && PAGE_FILES.includes(e.name))) {
      rutas.push(segmentos);
    }
    for (const e of entradas) {
      if (!e.isDirectory()) continue;
      // Los grupos de rutas `(app)` / `(public)` y ranuras `@modal` no forman parte de la URL pública
      if (e.name.startsWith('@') || e.name.startsWith('_')) continue;
      if (e.name.startsWith('(') && e.name.endsWith(')')) {
        recorrer(path.join(dir, e.name), segmentos);
      } else {
        recorrer(path.join(dir, e.name), [...segmentos, e.name]);
      }
    }
  }

  recorrer(appDir, []);
  return rutas;
}

export function coincideRutaConPaginasReales(dest: string, patrones: string[][]): boolean {
  if (dest.startsWith('http://') || dest.startsWith('https://') || dest.startsWith(':')) {
    return true;
  }

  const cleanPath = dest.split('?')[0].split('#')[0].replace(/\/+$/, '');
  const segsDestino = cleanPath.split('/').filter(Boolean);

  return patrones.some((patron) => {
    let i = 0;
    let j = 0;
    while (i < patron.length && j < segsDestino.length) {
      const pSeg = patron[i];
      const dSeg = segsDestino[j];

      if (pSeg.startsWith('[[...') && pSeg.endsWith(']]')) {
        return true;
      }
      if (pSeg.startsWith('[...') && pSeg.endsWith(']')) {
        return j < segsDestino.length;
      }
      if (pSeg.startsWith('[') && pSeg.endsWith(']')) {
        i++;
        j++;
        continue;
      }
      if (dSeg.startsWith(':')) {
        return false;
      }
      if (pSeg === dSeg) {
        i++;
        j++;
        continue;
      }
      return false;
    }

    if (i === patron.length && j === segsDestino.length) return true;
    if (i === patron.length - 1 && patron[i].startsWith('[[...') && patron[i].endsWith(']]')) return true;
    return false;
  });
}

describe('Las direcciones viejas siguen andando y no tienen destinos huérfanos', () => {
  it('Verifica que todas las redirecciones de next.config.js y NO_SE_ENLAZAN apunten a páginas existentes en src/app', async () => {
    const rawRedirects = typeof nextConfig.redirects === 'function' ? await nextConfig.redirects() : [];
    const appDir = path.join(process.cwd(), 'src', 'app');
    const patrones = recolectarPatronesDePaginas(appDir);
    const invalidDestinations: string[] = [];

    // 1. Cada redirect en next.config.js debe aterrizar en una página real (sin destinos rotos)
    for (const r of rawRedirects) {
      if (r.destination && !coincideRutaConPaginasReales(r.destination, patrones)) {
        invalidDestinations.push(`redirect(${r.source} -> ${r.destination})`);
      }
    }

    // 2. Cada quedaEn en NO_SE_ENLAZAN debe ser una página real o un redirect válido cuya meta sea una página real
    for (const item of NO_SE_ENLAZAN) {
      if (!item.quedaEn) continue;
      if (coincideRutaConPaginasReales(item.quedaEn, patrones)) continue;

      const cleanQuedaEn = item.quedaEn.split('?')[0].split('#')[0];
      const redir = rawRedirects.find((r: any) => !r.has && !r.missing && r.source === cleanQuedaEn);
      if (redir?.destination && coincideRutaConPaginasReales(redir.destination, patrones)) {
        continue;
      }
      invalidDestinations.push(`NO_SE_ENLAZAN(${item.ruta} -> ${item.quedaEn})`);
    }

    expect(invalidDestinations).toEqual([]);
  });

  it('Rechaza destinos inventados que no existen en src/app (anti-falso-positivo)', () => {
    const appDir = path.join(process.cwd(), 'src', 'app');
    const patrones = recolectarPatronesDePaginas(appDir);

    expect(coincideRutaConPaginasReales('/pagina-que-no-existe-336', patrones)).toBe(false);
    expect(coincideRutaConPaginasReales('/empresa/ruta-inventada', patrones)).toBe(false);
    expect(coincideRutaConPaginasReales('/mi-dia', patrones)).toBe(true);
    expect(coincideRutaConPaginasReales('/fiestas/:id/centro', patrones)).toBe(true);
  });
});
