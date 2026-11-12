/**
 * El respaldo automático falló 340 veces seguidas (auditor externo, 12/11/2026) porque la lista de lo que se
 * respalda decía que `galeria-publica.json` y `carga-operativa-templates.json` eran listas, y en la base son
 * objetos. La lectura marcaba "falla" y el respaldo entero no se guardaba nunca.
 *
 * Este control compara la forma que espera el respaldo con la forma con que la app lee y guarda cada archivo.
 */
import fs from 'fs';
import path from 'path';
import { BACKUP_COLLECTIONS } from '@/lib/backup/backup-registry';

const RAIZ = path.join(process.cwd(), 'src');
const LLAMADA = /(?:readData|readDataConDetalle|writeData|mutarDocumento)(?:<[^>]*>)?\(\s*'([a-z0-9-]+\.json)'\s*,\s*(\[|\{)/g;

function archivosDeCodigo(dir: string, salida: string[] = []): string[] {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entrada.name === '__tests__' || entrada.name === 'data') continue;
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) archivosDeCodigo(ruta, salida);
    else if (/\.(ts|tsx)$/.test(entrada.name) && !/\.test\.tsx?$/.test(entrada.name)) salida.push(ruta);
  }
  return salida;
}

function formaQueUsaLaApp(): Map<string, Set<'lista' | 'objeto'>> {
  const formas = new Map<string, Set<'lista' | 'objeto'>>();
  for (const archivo of archivosDeCodigo(RAIZ)) {
    const texto = fs.readFileSync(archivo, 'utf8');
    for (const m of texto.matchAll(LLAMADA)) {
      const forma = m[2] === '[' ? 'lista' : 'objeto';
      if (!formas.has(m[1])) formas.set(m[1], new Set());
      formas.get(m[1])!.add(forma);
    }
  }
  return formas;
}

describe('El respaldo espera la forma con que se guarda cada archivo', () => {
  it('la galería pública y las plantillas de carga se respaldan como objeto', () => {
    const porArchivo = new Map(BACKUP_COLLECTIONS.map((c) => [c.file, c.defaultValue]));
    expect(Array.isArray(porArchivo.get('galeria-publica.json'))).toBe(false);
    expect(Array.isArray(porArchivo.get('carga-operativa-templates.json'))).toBe(false);
  });

  it('ningún archivo del respaldo espera una lista si la app lo guarda como objeto, ni al revés', () => {
    const formas = formaQueUsaLaApp();
    const distintos = BACKUP_COLLECTIONS.flatMap((c) => {
      const usadas = formas.get(c.file);
      if (!usadas || usadas.size !== 1) return [];
      const enLaApp = [...usadas][0];
      const enElRespaldo = Array.isArray(c.defaultValue) ? 'lista' : 'objeto';
      return enLaApp === enElRespaldo ? [] : [`${c.file}: el respaldo espera ${enElRespaldo} y la app usa ${enLaApp}`];
    });
    expect(distintos).toEqual([]);
  });
});
