import fs from 'node:fs';
import path from 'node:path';
import { getAllRoutes } from './helpers/route-inventory.mjs';

const RAIZ = process.cwd();
const ARCHIVO_LISTA = path.join(RAIZ, 'docs', 'lista-de-cierre.json');
const ARCHIVO_EXCEPCIONES = path.join(RAIZ, 'docs', 'robot-excepciones.json');
const RESULTADOS_RECORRIDO = path.join(RAIZ, 'test-results', 'recorrido', 'resultados.json');
const RESULTADOS_ROBOT = path.join(RAIZ, 'test-results', 'robot', 'resultados.json');
const TAMANOS = ['390x844', '820x1180', '1440x1000'];
const REGLAS_ROBOT = [
  'contexto',
  'no-se-cae',
  'ida-y-vuelta',
  'agregar-y-cancelar',
  'volver-no-pierde',
  'descargas-pdf',
  'publico-sin-borradores',
  'lectura-fallida-no-es-cero',
];

function cargarExcepciones() {
  if (!fs.existsSync(ARCHIVO_EXCEPCIONES)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(ARCHIVO_EXCEPCIONES, 'utf8'));
    return Array.isArray(data?.excepciones) ? data.excepciones : [];
  } catch {
    return [];
  }
}

function buscarExcepcion(excepciones, ruta, regla) {
  return excepciones.find(
    (e) =>
      e &&
      e.ruta === ruta &&
      (e.regla === regla || e.regla === `robot:${regla}` || `robot:${e.regla}` === regla),
  );
}

function construirBase() {
  const rutas = getAllRoutes();
  const excepciones = cargarExcepciones();
  const existente = fs.existsSync(ARCHIVO_LISTA)
    ? JSON.parse(fs.readFileSync(ARCHIVO_LISTA, 'utf8'))
    : { casilleros: {} };
  const casilleros = {};

  for (const r of rutas) {
    const ruta = r.routeTemplate || r.path;
    const modulo = r.moduleName || 'general';
    for (const t of TAMANOS) {
      const clave = `${ruta} [${t}]`;
      casilleros[clave] = existente.casilleros?.[clave] || {
        ruta,
        modulo,
        tamano: t,
        estado: 'sin-mirar',
        ultimaMirada: null,
      };
    }

    for (const regla of REGLAS_ROBOT) {
      const col = `robot:${regla}`;
      const clave = `${ruta} [${col}]`;
      const previo = existente.casilleros?.[clave];
      const exc = buscarExcepcion(excepciones, ruta, regla);
      const base = previo || {
        ruta,
        modulo,
        tamano: col,
        regla,
        estado: 'sin-mirar',
        ultimaMirada: null,
      };
      if (exc) {
        base.estado = 'verde';
        base.excepcionMotivo = exc.motivo || 'Excepción aprobada en docs/robot-excepciones.json';
      }
      casilleros[clave] = base;
    }
  }

  return {
    actualizadaEn: new Date().toISOString(),
    totalCasilleros: Object.keys(casilleros).length,
    casilleros,
  };
}

function actualizarDesdeResultados(lista) {
  const ahora = new Date().toISOString();
  const excepciones = cargarExcepciones();

  if (fs.existsSync(RESULTADOS_RECORRIDO)) {
    const resultados = JSON.parse(fs.readFileSync(RESULTADOS_RECORRIDO, 'utf8'));
    for (const res of resultados) {
      const tam = res.tamano || '1440x1000';
      const clave = `${res.routeTemplate} [${tam}]`;
      if (lista.casilleros[clave]) {
        lista.casilleros[clave].estado = res.estado === 'PASO' ? 'verde' : 'rojo';
        lista.casilleros[clave].ultimaMirada = ahora;
        if (res.motivo) lista.casilleros[clave].motivo = res.motivo;
      }
    }
  }

  if (fs.existsSync(RESULTADOS_ROBOT)) {
    const resultadosRobot = JSON.parse(fs.readFileSync(RESULTADOS_ROBOT, 'utf8'));
    for (const res of resultadosRobot) {
      const ruta = res.routeTemplate;
      for (const regla of REGLAS_ROBOT) {
        const clave = `${ruta} [robot:${regla}]`;
        const casillero = lista.casilleros[clave];
        if (!casillero) continue;

        const exc = buscarExcepcion(excepciones, ruta, regla);
        const info = res.reglas?.[regla];
        casillero.ultimaMirada = res.actualizadoEn || ahora;

        if (exc) {
          casillero.estado = 'verde';
          casillero.excepcionMotivo = exc.motivo || 'Excepción aprobada en docs/robot-excepciones.json';
          delete casillero.motivo;
          continue;
        }

        if (info?.estado === 'verde' || info?.estado === 'rojo' || info?.estado === 'sin-mirar') {
          casillero.estado = info.estado;
          if (info.motivo) casillero.motivo = info.motivo;
          else delete casillero.motivo;
          if (info.elemento) casillero.elemento = info.elemento;
          else delete casillero.elemento;
        }
      }
    }
  }

  lista.actualizadaEn = ahora;
  return lista;
}

const args = process.argv.slice(2);
let lista = construirBase();
if (args.includes('--actualizar')) {
  lista = actualizarDesdeResultados(lista);
}
fs.mkdirSync(path.dirname(ARCHIVO_LISTA), { recursive: true });
fs.writeFileSync(ARCHIVO_LISTA, JSON.stringify(lista, null, 2) + '\n', 'utf8');

const valores = Object.values(lista.casilleros);
const pendientes = valores.filter((c) => c.estado !== 'verde');

console.log(`LISTA DE CIERRE: ${pendientes.length} casilleros en rojo o sin mirar (de ${valores.length}).`);
for (const p of pendientes.slice(0, 10)) {
  console.log(`  - [${p.estado}] ${p.ruta} (${p.tamano})`);
}
