/**
 * Pedido del dueño (20/10/2026): "cada vez que hacemos una auditoría siguen habiendo problemas, cosas
 * que ya habías resuelto". El álbum que mandaba al disco de todos se arregló en una pantalla y su
 * control leía sólo esa; la misma línea seguía en otra. `scripts/formas-ya-arregladas.mjs` toma cada
 * forma que un control prohíbe en un archivo y la busca en toda la app (pregunta 81 de COMO-AUDITAR).
 *
 * Esta prueba arma una app de mentira en una carpeta temporal y mira que el script encuentre la forma
 * en el archivo que el control no miraba, y que no invente nada cuando no está.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { spawnSync } from 'child_process';

const SCRIPT = join(process.cwd(), 'scripts', 'formas-ya-arregladas.mjs');

function armarApp(otraPantalla: string) {
  const raiz = mkdtempSync(join(tmpdir(), 'formas-'));
  mkdirSync(join(raiz, 'src', '__tests__'), { recursive: true });
  mkdirSync(join(raiz, 'src', 'app'), { recursive: true });
  writeFileSync(
    join(raiz, 'src', '__tests__', 'album.test.ts'),
    [
      "const codigo = leer('src/app/hub.tsx');",
      "expect(codigo).not.toMatch(/galeriaUrl\\s*\\|\\|\\s*['\"]https?:\\/\\//);",
    ].join('\n'),
  );
  writeFileSync(join(raiz, 'src', 'app', 'hub.tsx'), 'const url = fiesta.galeriaUrl;\n');
  writeFileSync(join(raiz, 'src', 'app', 'post-fiesta.tsx'), otraPantalla);
  return raiz;
}

function correr(raiz: string) {
  const r = spawnSync('node', [SCRIPT, '--json'], { cwd: raiz, encoding: 'utf8' });
  expect(r.status).toBe(0);
  return JSON.parse(r.stdout) as Array<{ archivo: string; linea: number; prueba: string }>;
}

describe('lo que ya se arregló en un archivo se busca en toda la app', () => {
  it('encuentra la misma forma en otra pantalla', () => {
    const raiz = armarApp("const x = 1;\nconst url = fiesta.galeriaUrl || 'https://wfolio.com/my/disk';\n");
    try {
      const hallazgos = correr(raiz);
      expect(hallazgos).toEqual([
        expect.objectContaining({ archivo: 'src/app/post-fiesta.tsx', linea: 2, prueba: 'album.test.ts' }),
      ]);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });

  it('no inventa nada cuando la forma no está', () => {
    const raiz = armarApp('const url = fiesta.galeriaUrl;\n');
    try {
      expect(correr(raiz)).toEqual([]);
    } finally {
      rmSync(raiz, { recursive: true, force: true });
    }
  });
});
