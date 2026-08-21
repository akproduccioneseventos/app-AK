/**
 * El control de acentos rotos tiene que mirar también la documentación.
 *
 * Por que existe esta prueba: `docs/YA-RESUELTO.md` es lo que todos leen antes
 * de auditar, y junto 427 acentos rotos sin que nadie lo viera, porque la
 * revision completa solo miraba el codigo. Se arreglo agregando `*.md`, y **una
 * fusion posterior de otra sesion volvio a sacar esa palabra del script**: a los
 * pocos dias el archivo tenia 425 acentos rotos otra vez y el control seguia
 * diciendo que estaba todo bien.
 *
 * Un control que dice "todo bien" cuando no lo esta es peor que no tenerlo.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';

const RAIZ = process.cwd();

describe('El control de acentos rotos', () => {
  it('mira también los documentos, no sólo el código', () => {
    const script = readFileSync(join(RAIZ, 'scripts/check-acentos.sh'), 'utf-8');

    // La linea del barrido completo (la que corre sin argumentos).
    const barridoCompleto = script
      .split('\n')
      .find((linea) => linea.includes('git ls-files') && linea.includes('*.tsx'));

    expect(barridoCompleto).toBeDefined();
    expect(barridoCompleto).toContain("'*.md'");
  });

  it('la documentación que se lee antes de auditar está limpia', () => {
    // Secuencias tipicas de UTF-8 leido a la latina.
    const rotos = /Ã[-¿]|Â[-¿]|â€/;

    const documentos = execFileSync('git', ['ls-files', '--', '*.md'], {
      cwd: RAIZ,
      encoding: 'utf-8',
    })
      .split('\n')
      .filter(Boolean)
      // Estos escriben los ejemplos rotos a proposito para explicar el problema:
      // muestran como queda un menu o un plato con el acento partido.
      // Arreglarlos les saca el sentido a esas frases.
      //
      // `auditoria-out/informe.md` no se escribe a mano: lo genera
      // `npm run auditoria` copiando textos del codigo, y uno de ellos es el de la
      // pantalla que repara acentos rotos, que muestra el ejemplo roto a proposito.
      .filter(
        (ruta) =>
          !['AGENTS.md', 'ESTADO-AUDITORIA.md', 'auditoria-out/informe.md'].includes(ruta),
      );

    const sucios = documentos.filter((ruta) =>
      rotos.test(readFileSync(join(RAIZ, ruta), 'utf-8')),
    );

    expect(sucios).toEqual([]);
  });
});
