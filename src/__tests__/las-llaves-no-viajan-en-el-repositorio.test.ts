import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Ninguna llave de la empresa viaja adentro del repositorio.
 *
 * Por que existe esta prueba: una llave de cobros de produccion de Mercado Pago
 * llego escrita dentro de `src/data/settings.json`. Esa llave **mueve plata de
 * verdad**: quien la tenga puede cobrar y devolver en nombre de la empresa. Y si
 * entra al repositorio queda en el historial para siempre, aunque despues se
 * borre el archivo.
 *
 * Ya habia pasado una vez con el permiso para publicar en el Facebook y el
 * Instagram de AK. La segunda vez no se arregla pidiendo cuidado: se arregla con
 * una prueba.
 *
 * Las llaves van en la consola del servidor, nunca en un archivo del proyecto.
 */
/**
 * Los patrones son estrechos a proposito.
 *
 * La primera version marcaba tres archivos que estaban perfectos: un texto de
 * ayuda que explica donde va una clave, y dos imagenes guardadas como texto que
 * por casualidad empiezan igual que un permiso de Meta. **Un control que grita
 * cuando no pasa nada lo apaga cualquiera el primer dia**, y entonces no frena
 * nada el dia que si pasa.
 */
const PATRONES: Array<{ nombre: string; patron: RegExp }> = [
  // Formato real: APP_USR-<numero>-<fecha>-<hash>-<numero>.
  { nombre: 'llave de cobros de Mercado Pago', patron: /APP_USR-\d{6,}-\d{6}-[a-f0-9]{20,}/ },
  { nombre: 'llave de prueba de Mercado Pago', patron: /TEST-\d{10,}-\d{6}-[a-f0-9]{20,}/ },
  // Un permiso de Meta solo cuenta si esta puesto como valor de un permiso, no
  // cualquier texto largo que arranque igual.
  {
    nombre: 'permiso de Meta (Facebook o Instagram)',
    patron: /(access_?token|Bearer)["'\s:=]+EAA[A-Za-z0-9]{60,}/i,
  },
  { nombre: 'clave privada', patron: /-----BEGIN [A-Z ]*PRIVATE KEY-----\n?[A-Za-z0-9+/]{40,}/ },
  {
    nombre: 'llave de servicio de Google',
    patron: /"type":\s*"service_account"[\s\S]{0,400}"private_key"/,
  },
];

function archivosVersionados(): string[] {
  return execSync('git ls-files', { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 })
    .split('\n')
    .filter(Boolean)
    // Este mismo archivo nombra los patrones para poder buscarlos.
    .filter((archivo) => !archivo.endsWith('las-llaves-no-viajan-en-el-repositorio.test.ts'));
}

describe('las llaves de la empresa', () => {
  it('no aparecen en ningun archivo versionado', () => {
    const encontrados: string[] = [];

    for (const archivo of archivosVersionados()) {
      const completo = path.join(process.cwd(), archivo);

      let contenido: string;
      try {
        const datos = fs.statSync(completo);
        if (!datos.isFile() || datos.size > 2 * 1024 * 1024) continue;
        contenido = fs.readFileSync(completo, 'utf8');
      } catch {
        continue;
      }

      for (const { nombre, patron } of PATRONES) {
        if (patron.test(contenido)) encontrados.push(`${archivo}: ${nombre}`);
      }
    }

    expect(encontrados).toEqual([]);
  });

  it('el archivo de configuracion con las llaves esta fuera del repositorio', () => {
    const gitignore = fs.readFileSync(path.join(process.cwd(), '.gitignore'), 'utf8');

    expect(gitignore).toContain('src/data/settings.json');
    expect(gitignore).toContain('src/data/social-connections.json');
  });
});
