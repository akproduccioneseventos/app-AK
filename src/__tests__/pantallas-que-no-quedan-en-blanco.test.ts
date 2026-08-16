import fs from 'fs';
import path from 'path';

// Tres pantallas que ve el invitado (o el salon entero, en el televisor)
// quedaban sin mostrar nada. No eran errores de programa: la pagina cargaba
// bien y el usuario veia un rectangulo vacio. Estas pruebas cuidan que no
// vuelva a pasar.

function leer(relativo: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativo), 'utf8');
}

describe('pantallas que no pueden quedar en blanco', () => {
  it('el muro en vivo muestra algo cuando la rotacion llega a dedicatorias', () => {
    const fuente = leer('src/app/evento/muro-en-vivo/[fiestaId]/page.tsx');

    // El bloque de dedicatorias esta desactivado a proposito (los saludos van
    // en otro modulo). Si se lo excluye ademas del estado vacio, la pantalla
    // del salon queda negra hasta que la rotacion pase de largo.
    const listaDeExcluidos = fuente.match(
      /!\[[^\]]*\]\.includes\(activeScreenItem\?\.type \?\? ''\)/
    );
    expect(listaDeExcluidos).not.toBeNull();
    expect(listaDeExcluidos?.[0]).not.toContain("'dedicaciones'");
  });

  it('el muro en vivo avisa cuando esta apagado para esa fiesta', () => {
    const fuente = leer('src/app/evento/muro-en-vivo/[fiestaId]/page.tsx');

    expect(fuente).toContain('live-wall-disabled');
    expect(fuente).toContain('El muro de fotos está apagado para esta fiesta');
  });

  it.each([
    ['src/app/evento/zona-digital/[fiestaId]/page.tsx', 'zona digital'],
    ['src/app/evento/mi-mesa/[fiestaId]/page.tsx', 'mi mesa'],
  ])('el cartel de %s no queda blanco sobre blanco', relativo => {
    const fuente = leer(relativo);

    // .ak-live-panel pinta el fondo oscuro desde la capa de componentes, y
    // pierde contra el blanco que trae Card. Con texto blanco encima, el
    // cartel existia pero no se leia nada.
    const cartelesInvisibles = fuente
      .split('\n')
      .filter(linea => linea.includes('ak-live-panel') && linea.includes('<Card'));

    expect(cartelesInvisibles).toEqual([]);
  });
});
