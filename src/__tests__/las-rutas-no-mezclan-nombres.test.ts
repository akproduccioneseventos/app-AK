/**
 * 12/11/2026: la entrega 1385 sumó `api/fiestas/[id]/` al lado de `api/fiestas/[fiestaId]/`. Compila, pero al arrancar
 * Next tira "You cannot use different slug names for the same dynamic path" y TODA la app contesta 500.
 */
import fs from 'fs';
import path from 'path';

function carpetasConDosNombres(dir: string, encontrados: string[]) {
  const entradas = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory());
  const dinamicas = new Set(
    entradas.map((e) => e.name).filter((n) => /^\[.+\]$/.test(n)).map((n) => n.replace(/^\[+\.{0,3}|\]+$/g, '')),
  );
  if (dinamicas.size > 1) encontrados.push(`${path.relative(process.cwd(), dir)}: ${[...dinamicas].join(' y ')}`);
  for (const e of entradas) carpetasConDosNombres(path.join(dir, e.name), encontrados);
}

describe('las rutas no mezclan nombres en el mismo lugar', () => {
  it('ninguna carpeta de src/app tiene dos partes variables con nombres distintos', () => {
    const encontrados: string[] = [];
    carpetasConDosNombres(path.join(process.cwd(), 'src/app'), encontrados);
    expect(encontrados).toEqual([]);
  });
});
