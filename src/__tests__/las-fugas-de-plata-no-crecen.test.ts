/**
 * Pedido del dueño (20/10/2026): "me pone nervioso que sigan habiendo ese tipo de errores".
 *
 * Una pregunta del método encuentra el error; no impide que vuelva a entrar. Este control sí: mira
 * dos formas de fuga de plata y permisos que aparecieron el mismo día y FRENA la publicación si
 * aparece un caso NUEVO. Los casos ya conocidos están listados con su orden de arreglo: cuando
 * Gemini los arregla, se sacan de la lista (y si alguien los arregla y no los saca, también avisa,
 * para que la lista no quede vieja).
 *
 * 1. Pregunta 69: un archivo `'use server'` fuera de `src/app/` deja TODAS sus funciones llamables
 *    desde el navegador, sin el permiso que pide la acción que las usa.
 * 3. Pregunta 74: una ruta que llama una máquina de afuera (el despertador, un webhook) y que la
 *    puerta general de la app manda a /login porque no figura como pública: no corre nunca.
 * 2. Pregunta 68 (ampliada): una acción de servidor que DEVUELVE una fiesta o un presupuesto entero
 *    sin pasarlo por el recorte del perfil (Codex 150: guardar devolvía costos y sueldos ajenos).
 */
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';
import { PUBLIC_EXACT_PATHS, isPublicPathPrefix } from '@/lib/auth/public-paths';

const RAIZ = process.cwd();

function archivos(dir: string, salida: string[] = []): string[] {
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (nombre === '__tests__' || nombre === 'node_modules') continue;
    if (statSync(ruta).isDirectory()) archivos(ruta, salida);
    else if (/\.(ts|tsx)$/.test(nombre) && !/\.(test|spec)\.tsx?$/.test(nombre)) salida.push(ruta);
  }
  return salida;
}

const rel = (ruta: string) => relative(RAIZ, ruta).split(sep).join('/');
const esUseServer = (codigo: string) => /^['"]use server['"];?\s*$/m.test(codigo);

/** Orden 193, bloque 1 (y 197). Se sacan de acá a medida que se arreglan. */
/** Orden 193, bloque 1: arreglados todos en la entrega de la orden 197 (20/10/2026). */
const USE_SERVER_FUERA_DE_APP_CONOCIDOS = new Set<string>([]);

/** Orden 198 (y 197). `archivo:función` que hoy devuelven el objeto entero. */
const DEVUELVEN_ENTERO_CONOCIDOS = new Set<string>(DEVUELVEN_ENTERO_CONFIRMADOS());

function DEVUELVEN_ENTERO_CONFIRMADOS(): string[] {
  // Orden 198: arreglados todos el 20/10/2026 (entrega de la orden 197 más lo que terminó Claude).
  return [];
}

// `return { ..., fiesta: x }`, `updatedFiesta: x`, `presupuesto: x` sin recorte en la misma línea.
const DEVUELVE_ENTERO = /return\s*\{[^}\n]*\b(fiesta|updatedFiesta)\s*:\s*(?=\S)(?!recortar|paraAfuera|null|undefined)/;

export function useServerFueraDeApp(): string[] {
  return archivos(join(RAIZ, 'src'))
    .filter((r) => !rel(r).startsWith('src/app/'))
    .filter((r) => esUseServer(readFileSync(r, 'utf8')))
    .map(rel)
    .sort();
}

export function accionesQueDevuelvenEntero(): string[] {
  return archivos(join(RAIZ, 'src'))
    .filter((r) => esUseServer(readFileSync(r, 'utf8')))
    .filter((r) => readFileSync(r, 'utf8').split('\n').some((l) => DEVUELVE_ENTERO.test(l)))
    .map(rel)
    .sort();
}

/** Orden 194, bloque 1 (y 197). Rutas que llama una máquina y la puerta hoy rebota. */
/** Orden 194, bloque 1: arregladas todas en la entrega de la orden 197 (20/10/2026). */
const RUTAS_DE_MAQUINA_BLOQUEADAS_CONOCIDAS = new Set<string>([]);

const LA_LLAMA_UNA_MAQUINA = /CRON_SECRET|TAREAS_SECRET|abrirPuertaDeLaTarea|x-hub-signature|x-twilio-signature/i;

export function rutasDeMaquinaBloqueadas(): string[] {
  return archivos(join(RAIZ, 'src/app/api'))
    .filter((r) => r.endsWith(`${sep}route.ts`) && LA_LLAMA_UNA_MAQUINA.test(readFileSync(r, 'utf8')))
    .map((r) => '/' + rel(r).replace(/^src\/app\//, '').replace(/\/route\.ts$/, ''))
    .filter((ruta) => !PUBLIC_EXACT_PATHS.has(ruta) && !isPublicPathPrefix(ruta))
    .sort();
}

describe('las fugas de plata conocidas no crecen', () => {
  it('ninguna ruta nueva que llama una máquina queda rebotada por la puerta (pregunta 74)', () => {
    const nuevas = rutasDeMaquinaBloqueadas().filter((r) => !RUTAS_DE_MAQUINA_BLOQUEADAS_CONOCIDAS.has(r));
    expect(nuevas).toEqual([]);
  });

  it('las rutas de máquina ya arregladas salen de la lista', () => {
    const actuales = new Set(rutasDeMaquinaBloqueadas());
    expect([...RUTAS_DE_MAQUINA_BLOQUEADAS_CONOCIDAS].filter((r) => !actuales.has(r))).toEqual([]);
  });

  it('ningún archivo nuevo fuera de src/app/ es "use server" (pregunta 69)', () => {
    const nuevos = useServerFueraDeApp().filter((r) => !USE_SERVER_FUERA_DE_APP_CONOCIDOS.has(r));
    expect(nuevos).toEqual([]);
  });

  it('la lista de conocidos no queda vieja: si uno se arregló, se saca', () => {
    const actuales = new Set(useServerFueraDeApp());
    const yaArreglados = [...USE_SERVER_FUERA_DE_APP_CONOCIDOS].filter((r) => !actuales.has(r));
    expect(yaArreglados).toEqual([]);
  });

  it('ninguna acción nueva devuelve una fiesta entera sin recortar (pregunta 68)', () => {
    const nuevas = accionesQueDevuelvenEntero().filter((r) => !DEVUELVEN_ENTERO_CONOCIDOS.has(r));
    expect(nuevas).toEqual([]);
  });

  it('el control frena (se rompe a propósito)', () => {
    expect(DEVUELVE_ENTERO.test('    return { success: true, fiesta: r.updatedFiesta };')).toBe(true);
    expect(DEVUELVE_ENTERO.test('    return { success: true, fiesta: recortarFiestaPorPerfil(f, u) };')).toBe(false);
    expect(esUseServer("'use server';\nexport async function x() {}")).toBe(true);
  });
});
