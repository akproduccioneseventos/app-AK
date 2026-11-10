/** @jest-environment node */
/**
 * Orden 270, bloque 6: dos cambios de regla de la IA a la vez no pierden uno.
 *
 * Con la base, el guardado va por `mutarDocumento` (una transacción). La base de mentira devuelve una COPIA en
 * cada lectura y tarda en contestar (error 11 de CLAUDE.md), y la transacción de mentira hace lo que hace la de
 * verdad: leer, cambiar y escribir sin que otro se meta en el medio. Con el guardado viejo (leer todo con
 * `readDataConDetalle`, cambiar una y reescribir todo con `writeData`) se pierde una: se probó así y da rojo.
 */
jest.mock('server-only', () => ({}));

const almacen: Record<string, any> = {};
const demora = () => new Promise((r) => setTimeout(r, 20));
const copia = (v: any) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (f: string, vacio: any) => { await demora(); return copia(almacen[f]) ?? vacio; }),
  readDataConDetalle: jest.fn(async (f: string, vacio: any) => { await demora(); return { valor: copia(almacen[f]) ?? vacio, huboFalla: false }; }),
  writeData: jest.fn(async (f: string, d: any) => { await demora(); almacen[f] = copia(d); }),
}));

let cola: Promise<unknown> = Promise.resolve();
jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumento: jest.fn((f: string, vacio: any, cambiar: (a: any) => any) => {
    const turno = cola.then(async () => {
      await demora();
      const nuevo = await cambiar(copia(almacen[f]) ?? vacio);
      if (nuevo === null) return null;
      await demora();
      almacen[f] = copia(nuevo);
      return nuevo;
    });
    cola = turno.catch(() => undefined);
    return turno;
  }),
}));

import fs from 'fs';
import os from 'os';
import path from 'path';
import { guardarReglaIA } from '@/lib/ia/reglas-de-la-ia';

describe('Orden 270 (bloque 6): dos reglas de la IA a la vez no se pisan', () => {
  const entorno = { node: process.env.NODE_ENV, local: process.env.AK_USE_LOCAL_JSON_ONLY };
  let carpeta = '';
  let cwd: jest.SpyInstance;

  beforeEach(() => {
    for (const k of Object.keys(almacen)) delete almacen[k];
    (process.env as any).NODE_ENV = 'production';
    delete process.env.AK_USE_LOCAL_JSON_ONLY;
    carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'reglas-ia-'));
    cwd = jest.spyOn(process, 'cwd').mockReturnValue(carpeta);
  });
  afterEach(() => {
    cwd.mockRestore();
    fs.rmSync(carpeta, { recursive: true, force: true });
    (process.env as any).NODE_ENV = entorno.node;
    if (entorno.local !== undefined) process.env.AK_USE_LOCAL_JSON_ONLY = entorno.local;
  });

  test('dos guardados a la vez de reglas distintas quedan los dos', async () => {
    const [a, b] = await Promise.all([
      guardarReglaIA('anticipador', 'apagada', 'dueno'),
      guardarReglaIA('resumen_de_la_manana', 'preguntar', 'dueno'),
    ]);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(almacen['reglas-de-la-ia.json']).toMatchObject({ anticipador: 'apagada', resumen_de_la_manana: 'preguntar' });
  });

  test('cinco a la vez no pierden ninguna', async () => {
    const tareas = ['anticipador', 'resumen_de_la_manana', 'borradores_redes_posfiesta', 'vigilante_noche', 'generador_contenido'];
    const r = await Promise.all(tareas.map((t) => guardarReglaIA(t, 'preguntar', 'dueno')));
    expect(r.every((x) => x.success)).toBe(true);
    for (const t of tareas) expect(almacen['reglas-de-la-ia.json'][t]).toBe('preguntar');
  });
});
