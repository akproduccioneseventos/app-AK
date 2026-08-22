/**
 * EL CANDADO DEL MANUAL.
 *
 * Por que existe: el manual de la app (docs/MANUAL-DE-LA-APP.md) y el mapa que
 * lee la asistente sirven mientras digan la verdad. Un manual viejo hace mas
 * dano que no tener ninguno: manda al equipo a pantallas que ya no estan y le
 * hace prometer al cliente cosas que la app no hace.
 *
 * Prometer "me acuerdo de actualizarlo" ya sabemos como termina. Asi que el
 * mapa se arma solo leyendo la aplicacion, y este control lo vuelve a armar y
 * compara. Si alguien agrega o saca una pantalla y no regenera el mapa, esto se
 * pone en rojo y el cambio no entra.
 *
 * Si te salta en rojo: corre `npm run mapa:generar` y comita el resultado.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import {
  MENU_DEL_STAFF,
  TODAS_LAS_PANTALLAS,
  esPantallaReal,
} from '@/lib/multiagent/mapa-app.generado';

const RAIZ = process.cwd();
const ARCHIVO_MAPA = path.join(RAIZ, 'src/lib/multiagent/mapa-app.generado.ts');
const GENERADOR = path.join(RAIZ, 'scripts/generar-mapa-app.mjs');
const MANUAL = path.join(RAIZ, 'docs/MANUAL-DE-LA-APP.md');
const FLUJO_ASISTENTE = path.join(RAIZ, 'src/ai/flows/multiagent-flow.ts');

describe('El mapa de la app esta al dia', () => {
  it('el mapa generado coincide con las pantallas que hay de verdad', () => {
    const antes = readFileSync(ARCHIVO_MAPA, 'utf8');
    execFileSync('node', [GENERADOR], { cwd: RAIZ, stdio: 'pipe' });
    const despues = readFileSync(ARCHIVO_MAPA, 'utf8');

    if (antes !== despues) {
      // Dejamos el archivo como estaba para no ensuciar el arbol de trabajo.
      require('node:fs').writeFileSync(ARCHIVO_MAPA, antes, 'utf8');
    }

    expect(despues).toBe(antes);
  });

  it('cada opcion del menu lleva a una pantalla que existe', () => {
    const rotas = MENU_DEL_STAFF.filter(e => !esPantallaReal(e.ruta));
    expect(rotas.map(e => `${e.etiqueta} -> ${e.ruta}`)).toEqual([]);
  });

  it('la asistente solo puede llevar a pantallas que existen', () => {
    const texto = readFileSync(FLUJO_ASISTENTE, 'utf8');
    const bloque = texto.match(/"type":\s*"navigate"[\s\S]{0,1200}/)?.[0] ?? '';
    const rutas = [...bloque.matchAll(/"(\/[a-z0-9\-/[\]:.]*)"/gi)].map(m => m[1]);

    expect(rutas.length).toBeGreaterThan(0);
    const inventadas = rutas.filter(r => !esPantallaReal(r));
    expect(inventadas).toEqual([]);
  });

  it('cada pantalla que nombra el manual existe en la app', () => {
    const texto = readFileSync(MANUAL, 'utf8');
    // Solo las rutas escritas entre comillas invertidas, que son las que el
    // manual usa como "anda aca". El texto corrido no se revisa.
    const rutas = [...texto.matchAll(/`(\/[a-zA-Z0-9\-/:._]*)`/g)]
      .map(m => m[1])
      .filter(r => !r.startsWith('/api/'))
      .filter((r, i, a) => a.indexOf(r) === i);

    expect(rutas.length).toBeGreaterThan(20);
    const inventadas = rutas.filter(r => !esPantallaReal(r));
    expect(inventadas).toEqual([]);
  });

  it('el manual dice la cantidad de pantallas que hay de verdad', () => {
    const texto = readFileSync(MANUAL, 'utf8');
    expect(texto).toContain(`${TODAS_LAS_PANTALLAS.length} pantallas`);
    expect(texto).toContain(`${MENU_DEL_STAFF.length} opciones de men`);
  });
});
