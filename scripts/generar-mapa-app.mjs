#!/usr/bin/env node
/**
 * Arma solo el mapa de pantallas de la app.
 *
 * Por que existe: la asistente que vive adentro de la app tiene que poder
 * contestar "donde cargo la lista de compras" y llevar al usuario ahi. Antes
 * conocia 10 rutas escritas a mano, de mas de 300 que hay, y dos estaban mal.
 * Una lista escrita a mano se desactualiza el mismo dia que alguien agrega una
 * pantalla; esta se lee de la aplicacion de verdad.
 *
 * Salida: src/lib/multiagent/mapa-app.generado.ts
 * El control automatico src/__tests__/mapa-de-la-app-al-dia.test.ts vuelve a
 * correr esto y compara: si alguien agrega una pantalla y no regenera el mapa,
 * se pone en rojo y el cambio no entra.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const RAIZ = process.cwd();
const DIR_APP = join(RAIZ, 'src', 'app');
const ARCHIVO_MENU = join(RAIZ, 'src', 'components', 'main-nav.tsx');
const SALIDA = join(RAIZ, 'src', 'lib', 'multiagent', 'mapa-app.generado.ts');

/** Recorre src/app y devuelve la ruta URL de cada page.tsx. */
function buscarPaginas(dir, encontradas = []) {
  for (const nombre of readdirSync(dir)) {
    const completo = join(dir, nombre);
    if (statSync(completo).isDirectory()) {
      buscarPaginas(completo, encontradas);
    } else if (/^page\.(tsx|ts|jsx|js)$/.test(nombre)) {
      encontradas.push(completo);
    }
  }
  return encontradas;
}

/** src/app/(app)/empresa/menus/page.tsx -> /empresa/menus  ·  [id] -> :id */
function rutaDesdeArchivo(archivo) {
  const partes = relative(DIR_APP, archivo).split(sep).slice(0, -1);
  const limpias = partes
    .filter(p => !(p.startsWith('(') && p.endsWith(')'))) // grupos de ruta
    .filter(p => !p.startsWith('@')) // slots paralelos
    .map(p => p.replace(/^\[\.\.\.(.+)\]$/, ':$1*').replace(/^\[(.+)\]$/, ':$1'));
  return '/' + limpias.join('/');
}

const FAMILIAS = [
  ['portal-cliente', r => r.startsWith('/portal-cliente')],
  ['invitado', r => /^\/(evento|invitacion|portal-invitado|invitado|album|feedback|video-vida|post-fiesta|q|i)(\/|$)/.test(r)],
  ['publica', r => r === '/' || /^\/(landing|bodas|quinceaneras|cumpleanos|catalogo|public|club-uruguay|experiencia-ak|simulador-de-presupuesto|login|signup)(\/|$)/.test(r)],
  ['acceso-externo', r => /^\/(proveedor|acceso-personal|personal)(\/|$)/.test(r)],
  ['staff', () => true],
];

function familiaDe(ruta) {
  return FAMILIAS.find(([, prueba]) => prueba(ruta))[0];
}

/** Lee las entradas del menu del staff: { title, href }. */
function leerMenu() {
  const texto = readFileSync(ARCHIVO_MENU, 'utf8');
  const entradas = [];
  const re = /title:\s*"([^"]+)"\s*,\s*href:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(texto)) !== null) {
    entradas.push({ etiqueta: m[1], ruta: m[2] });
  }
  // Entradas fijas del encabezado y el pie del menu, que no siguen el
  // formato de lista (estan escritas como enlaces sueltos en el componente).
  const fijas = [
    { etiqueta: 'Centro de Control', ruta: '/' },
    { etiqueta: 'Nuevo Lead', ruta: '/admin' },
    { etiqueta: 'Alertas', ruta: '/alertas' },
  ];
  for (const f of fijas) {
    if (!texto.includes(`href="${f.ruta}"`)) continue;
    if (!entradas.some(e => e.ruta === f.ruta)) entradas.push(f);
  }
  return entradas;
}

const rutas = [...new Set(buscarPaginas(DIR_APP).map(rutaDesdeArchivo))].sort();
const menu = leerMenu();

const porFamilia = {};
for (const ruta of rutas) {
  const f = familiaDe(ruta);
  (porFamilia[f] ||= []).push(ruta);
}

const etiquetaDeRuta = new Map(menu.map(e => [e.ruta, e.etiqueta]));

const cabecera = `// ARCHIVO GENERADO. No lo edites a mano.
// Se arma con: npm run mapa:generar
// El control src/__tests__/mapa-de-la-app-al-dia.test.ts lo vuelve a armar y
// compara. Si agregaste una pantalla y no regeneraste, se pone en rojo.
`;

const cuerpo = `${cabecera}
export type FamiliaDePantalla =
  | 'staff'
  | 'portal-cliente'
  | 'invitado'
  | 'publica'
  | 'acceso-externo';

export type EntradaDeMenu = { etiqueta: string; ruta: string };

/** Las opciones del menu del panel, tal como las ve el equipo. */
export const MENU_DEL_STAFF: EntradaDeMenu[] = ${JSON.stringify(menu, null, 2)};

/** Todas las pantallas de la app, por familia. Los :id son partes variables. */
export const PANTALLAS_POR_FAMILIA: Record<FamiliaDePantalla, string[]> = ${JSON.stringify(porFamilia, null, 2)};

/** Todas las pantallas, planas. */
export const TODAS_LAS_PANTALLAS: string[] = Object.values(PANTALLAS_POR_FAMILIA).flat();

export const CUANTAS_PANTALLAS = TODAS_LAS_PANTALLAS.length;

/** Una ruta sirve para navegar si existe como pantalla de la app. */
export function esPantallaReal(ruta: string): boolean {
  if (TODAS_LAS_PANTALLAS.includes(ruta)) return true;
  const partes = ruta.split('/').filter(Boolean);
  return TODAS_LAS_PANTALLAS.some(p => {
    const suyas = p.split('/').filter(Boolean);
    if (suyas.length !== partes.length) return false;
    return suyas.every((s, i) => s.startsWith(':') || s === partes[i]);
  });
}

/**
 * Texto compacto para meterle a la asistente en el contexto: el menu con sus
 * etiquetas. Es lo que le permite decir "anda a Lista de Compras" y llevar.
 */
export function mapaParaLaAsistente(): string {
  const lineas = MENU_DEL_STAFF.map(e => \`• \${e.etiqueta} → \${e.ruta}\`);
  return [
    \`MAPA DEL PANEL (\${MENU_DEL_STAFF.length} opciones de menu, \${CUANTAS_PANTALLAS} pantallas en total):\`,
    ...lineas,
  ].join('\\n');
}
`;

writeFileSync(SALIDA, cuerpo, 'utf8');

const menuRoto = menu.filter(e => !rutas.includes(e.ruta) && !e.ruta.includes(':'));
console.log(`Mapa generado: ${rutas.length} pantallas, ${menu.length} opciones de menu.`);
for (const [f, lista] of Object.entries(porFamilia)) console.log(`  ${f}: ${lista.length}`);
if (menuRoto.length) {
  console.log('Opciones de menu que no llevan a ninguna pantalla:');
  for (const e of menuRoto) console.log(`  ${e.etiqueta} -> ${e.ruta}`);
}
