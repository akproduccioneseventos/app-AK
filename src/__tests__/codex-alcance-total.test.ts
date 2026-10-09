/**
 * Orden 112, contador de Codex (AUD01): un area limpia vuelve a mirarse si cambia algo que
 * la ALCANZA (un archivo de src/lib que usa una de sus pantallas), no solo si cambia dentro de
 * sus carpetas. Y ninguna pantalla puede quedar sin area. Todo con git falso.
 */
import fs from 'fs';
import path from 'path';
// @ts-ignore: script de node
import { cambioDesde, estadoReal, resumen, rutasSinArea } from '../../scripts/codex-limpio.mjs';
// @ts-ignore: script de node
import { archivosAlcanzadosDesde, pantallasTocadasDesde } from '../../scripts/pantallas-tocadas.mjs';

const datos = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'docs/codex/areas.json'), 'utf8'));
const areasLimpias = datos.areas.map((a: any) => ({ ...a, estado: 'limpia', commit: 'abc' }));

/** git falso: `diff` devuelve los archivos dados, `status` no devuelve nada. */
const gitCon = (archivos: string[]) => (args: string[]) => (args[0] === 'diff' ? archivos.join('\n') + '\n' : '');
const estadoDe = (id: string, archivos: string[], areas = areasLimpias) =>
  estadoReal(areas.find((a: any) => a.id === id), gitCon(archivos));

describe('El contador de Codex mira todo lo que un cambio alcanza', () => {
  it('un cambio en una pantalla del portal manda al portal a volver a mirar', () => {
    expect(estadoDe('portal', ['src/app/portal-cliente/[id]/page.tsx'])).toBe('volver-a-mirar');
  });

  it('un archivo de src/lib que usa una pantalla del area la manda a volver a mirar; si no la alcanza, no', () => {
    const lib = 'src/lib/commercial/contact.ts';
    const alcanzados: Set<string> = archivosAlcanzadosDesde([lib], () => '*');
    const pantallaDeFiesta = 'src/app/(app)/customers/page.tsx';
    expect(alcanzados.has(pantallaDeFiesta)).toBe(true);
    expect(estadoDe('fiesta', [lib])).toBe('volver-a-mirar');
    // Un area cuyas carpetas ese archivo no alcanza queda limpia.
    const ajena = { id: 'x', nombre: 'X', carpetas: ['src/app/signup'], estado: 'limpia', commit: 'abc' };
    expect([...alcanzados].some((f) => f.startsWith('src/app/signup/'))).toBe(false);
    expect(estadoReal(ajena, gitCon([lib]))).toBe('limpia');
  });

  it('un archivo que afecta a toda la app manda a todas las areas a volver a mirar', () => {
    for (const a of areasLimpias) {
      expect(cambioDesde('abc', a.carpetas, gitCon(['package.json']))).toBe(true);
    }
  });

  it('sin cambios, todas siguen limpias (el control no grita por todo)', () => {
    const r = resumen(areasLimpias, gitCon([]));
    expect(r.limpias).toBe(areasLimpias.length);
  });

  it('archivosAlcanzadosDesde incluye lo cambiado y pantallasTocadasDesde sigue devolviendo pantallas', () => {
    const semilla = 'src/lib/commercial/contact.ts';
    expect(archivosAlcanzadosDesde([semilla], () => '*').has(semilla)).toBe(true);
    const pantallas = pantallasTocadasDesde([semilla], () => '*');
    expect(Array.isArray(pantallas) || pantallas === 'TODO').toBe(true);
    if (Array.isArray(pantallas)) expect(pantallas).toContain('/customers');
  });
});

describe('Ninguna pantalla queda sin area', () => {
  it('rutasSinArea sobre el areas.json real da vacio', () => {
    expect(rutasSinArea(datos.areas)).toEqual([]);
  });

  it('con un area menos aparecen pantallas sin area y "terminado" es falso aunque todas esten limpias', () => {
    const menos = areasLimpias.filter((a: any) => a.id !== 'portal');
    expect(rutasSinArea(menos).length).toBeGreaterThan(0);
    const r = resumen(menos, gitCon([]));
    expect(r.limpias).toBe(menos.length);
    expect(r.sinArea.length).toBeGreaterThan(0);
    expect(r.terminado).toBe(false);
  });

  it('con todas limpias y nada afuera, terminado es verdadero', () => {
    expect(resumen(areasLimpias, gitCon([])).terminado).toBe(true);
  });

  it('el mapa cubre el publicador, data-service y el dock de presupuestos (orden 131)', () => {
    const todas = datos.areas.flatMap((a: any) => a.carpetas);
    for (const f of [
      'src/lib/presencia-digital/publicador.ts',
      'src/lib/data-service.ts',
      'src/components/presupuestos/budget-share-dock.tsx',
    ]) {
      expect(todas).toContain(f);
    }
  });

  it('el comando imprime cuantas pantallas quedan sin area', () => {
    const fuente = fs.readFileSync(path.join(process.cwd(), 'scripts/codex-limpio.mjs'), 'utf8');
    expect(fuente).toMatch(/pantallas sin area: Codex no las mira/);
  });
});
