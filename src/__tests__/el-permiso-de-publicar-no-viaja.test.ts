import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * El permiso para publicar en las redes de AK no puede terminar en el
 * repositorio.
 *
 * Por que existe esta prueba: al conectar la pagina de Facebook, la app guarda
 * el permiso que deja publicar en el Instagram y el Facebook de la empresa. Ese
 * permiso se escribe en `src/data/social-connections.json`, **que hasta hoy
 * estaba versionado**. La primera vez que el dueno conectara su cuenta, el
 * permiso hubiera viajado al repositorio.
 */

const ARCHIVO = 'src/data/social-connections.json';

describe('el permiso de publicar en redes no viaja al repositorio', () => {
  it('el archivo de conexiones no esta versionado', () => {
    const versionados = execFileSync('git', ['ls-files', ARCHIVO], {
      cwd: process.cwd(),
      encoding: 'utf8',
    }).trim();

    expect(versionados).toBe('');
  });

  it('esta ignorado a proposito, con el motivo escrito', () => {
    const ignorados = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');

    expect(ignorados).toContain(ARCHIVO);
    expect(ignorados).toContain('permiso de publicacion');
  });
});
