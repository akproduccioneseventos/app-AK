/** @jest-environment node */
/**
 * MATAFUEGO — Una prueba que arma su repositorio de mentira no puede escribir en el de verdad.
 *
 * Pasó el 6/10/2026: la prueba del entorno aislado hacía `git init` y `git commit` en una carpeta
 * temporal, pero corriendo adentro de la subida git deja puesta GIT_DIR apuntando al repositorio
 * de la app. El `commit` fue a parar ahí: un commit "base" que borraba todo y el repositorio
 * marcado como "sin carpeta de trabajo".
 *
 * Regla: toda prueba que llame a git para ESCRIBIR (init, commit, add, config, checkout) le pasa
 * un `env` sin las variables GIT_*. Se probó rompiéndolo: sacando `env: SIN_GIT` de la prueba del
 * entorno aislado, ésta se pone en rojo.
 */
import fs from 'node:fs';
import path from 'node:path';

const CARPETA = path.join(process.cwd(), 'src', '__tests__');
const ESCRIBE = /['"`](init|commit|add|config|checkout|reset|worktree)['"`]/;

describe('ninguna prueba escribe en el repositorio de verdad', () => {
  it('las que escriben con git limpian GIT_*', () => {
    const malas = fs.readdirSync(CARPETA)
      .filter((n) => /\.test\.tsx?$/.test(n) && n !== path.basename(__filename))
      .filter((n) => {
        const s = fs.readFileSync(path.join(CARPETA, n), 'utf8');
        const llamaGit = /(execFileSync|spawnSync|execFile|spawn)\(\s*['"`]git['"`]/.test(s);
        if (!llamaGit || !ESCRIBE.test(s)) return false;
        return !/startsWith\(\s*['"`]GIT_['"`]\s*\)/.test(s);
      });
    expect(malas).toEqual([]);
  });
});
