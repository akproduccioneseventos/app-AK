/**
 * El código de la app no puede preguntar si lo están probando (orden 108).
 *
 * Pasó el 2 de octubre de 2026: `actualizarFiesta` y el asistente del cliente miraban si una
 * función era una simulación de Jest (`.mock`) y, si lo era, tomaban otro camino. Las pruebas
 * pasaban por el atajo y ninguna recorría lo que corre en la fiesta; en el asistente, el atajo se
 * salteaba la sesión del portal.
 */
import fs from 'fs';
import path from 'path';

const PROHIBIDO = [/\.mock\s*[!=]==/, /_isMockFunction/, /JEST_WORKER_ID/, /\.mock\?\.\w/];

function archivosDeLaApp(dir: string): string[] {
  const out: string[] = [];
  for (const nombre of fs.readdirSync(dir)) {
    const ruta = path.join(dir, nombre);
    if (fs.statSync(ruta).isDirectory()) {
      if (nombre === '__tests__' || nombre === 'node_modules') continue;
      out.push(...archivosDeLaApp(ruta));
    } else if (/\.(ts|tsx)$/.test(nombre) && !/\.test\.(ts|tsx)$/.test(nombre) && !/\.d\.ts$/.test(nombre)) {
      out.push(ruta);
    }
  }
  return out;
}

function buscarAtajos(textos: Record<string, string>): string[] {
  const hallados: string[] = [];
  for (const [ruta, texto] of Object.entries(textos)) {
    texto.split('\n').forEach((linea, i) => {
      if (PROHIBIDO.some((p) => p.test(linea))) hallados.push(`${ruta}:${i + 1}`);
    });
  }
  return hallados;
}

describe('El código no sabe si lo prueban', () => {
  it('el control encuentra un atajo de prueba (se prueba rompiéndolo)', () => {
    expect(buscarAtajos({ 'x.ts': "if (typeof (saveFiesta as any).mock !== 'undefined') {}" })).toEqual(['x.ts:1']);
    expect(buscarAtajos({ 'y.ts': 'if (process.env.JEST_WORKER_ID) {}' })).toEqual(['y.ts:1']);
    expect(buscarAtajos({ 'z.ts': 'const ok = 1;' })).toEqual([]);
  });

  it('ningún archivo de la app tiene un camino distinto para las pruebas', () => {
    const raiz = path.join(process.cwd(), 'src');
    const textos: Record<string, string> = {};
    for (const f of archivosDeLaApp(raiz)) textos[path.relative(process.cwd(), f)] = fs.readFileSync(f, 'utf8');
    expect(buscarAtajos(textos)).toEqual([]);
  });
});
