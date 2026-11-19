import fs from 'node:fs';
import path from 'node:path';
import { getAllRoutes } from './helpers/route-inventory.mjs';

const RAIZ = process.cwd();
const ARCHIVO_LISTA = path.join(RAIZ, 'docs', 'lista-de-cierre.json');
const RESULTADOS_RECORRIDO = path.join(RAIZ, 'test-results', 'recorrido', 'resultados.json');
const TAMANOS = ['390x844', '820x1180', '1440x1000'];

function construirBase() {
  const rutas = getAllRoutes();
  const existente = fs.existsSync(ARCHIVO_LISTA)
    ? JSON.parse(fs.readFileSync(ARCHIVO_LISTA, 'utf8'))
    : { casilleros: {} };
  const casilleros = {};

  for (const r of rutas) {
    for (const t of TAMANOS) {
      const clave = `${r.routeTemplate || r.path} [${t}]`;
      casilleros[clave] = existente.casilleros?.[clave] || {
        ruta: r.routeTemplate || r.path,
        modulo: r.moduleName || 'general',
        tamano: t,
        estado: 'sin-mirar',
        ultimaMirada: null,
      };
    }
  }
  return {
    actualizadaEn: new Date().toISOString(),
    totalCasilleros: Object.keys(casilleros).length,
    casilleros,
  };
}

function actualizarDesdeResultados(lista) {
  if (!fs.existsSync(RESULTADOS_RECORRIDO)) return lista;
  const resultados = JSON.parse(fs.readFileSync(RESULTADOS_RECORRIDO, 'utf8'));
  const ahora = new Date().toISOString();

  for (const res of resultados) {
    const tam = res.tamano || '1440x1000';
    const clave = `${res.routeTemplate} [${tam}]`;
    if (lista.casilleros[clave]) {
      lista.casilleros[clave].estado = res.estado === 'PASO' ? 'verde' : 'rojo';
      lista.casilleros[clave].ultimaMirada = ahora;
      if (res.motivo) lista.casilleros[clave].motivo = res.motivo;
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
