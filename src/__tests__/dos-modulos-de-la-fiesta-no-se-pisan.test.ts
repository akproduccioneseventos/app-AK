/**
 * DOS MODULOS DE LA FIESTA AL MISMO TIEMPO: LOS DOS TIENEN QUE GUARDARSE.
 *
 * El defecto (PLAN-03), verificado el 9 de septiembre de 2026: cada modulo leia la fiesta
 * entera, cambiaba lo suyo y guardaba el objeto completo. Si dos personas o procesos guardaban
 * casi al mismo tiempo (por ejemplo, alguien organizando las tareas y otro eligiendo el menu),
 * el segundo escribia encima con la copia que leyo antes y el cambio del primero desaparecia.
 *
 * Con updateFiestaPartial, cada modulo guarda exclusivamente el pedazo que cambio y los dos
 * cambios quedan persistidos sin pisarse.
 */
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ id: 'admin', email: 'admin@ak.test' }),
  hasAppSession: jest.fn().mockResolvedValue(true),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: {} }),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { userId: 'admin', role: 'admin' } }),
  verifyPortalSession: jest.fn().mockResolvedValue(true),
}));

const almacen: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const norm = archivo.replace(/\\/g, '/');
    const guardado = almacen[norm];
    return guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado));
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const norm = archivo.replace(/\\/g, '/');
    almacen[norm] = JSON.parse(JSON.stringify(datos));
  }),
  updateDataPartial: jest.fn(async (archivo: string, partialData: any) => {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const norm = archivo.replace(/\\/g, '/');
    const existing = almacen[norm] || {};
    almacen[norm] = {
      ...existing,
      ...JSON.parse(JSON.stringify(partialData)),
    };
  }),
}));

import { updateTareas, addTarea } from '@/app/actions/fiesta/tareas.actions';
import { updateMenuAsignado } from '@/app/actions/fiesta/catering.actions';
import { updatePersonal } from '@/app/actions/fiesta/personal.actions';
import { updateDecoracion } from '@/app/actions/fiesta/decoracion.actions';

const FIESTA_ID = 'fiesta-concurrente-1';
const FIESTA_PATH = `fiestas/${FIESTA_ID}.json`;

const FIESTA_INICIAL = {
  id: FIESTA_ID,
  configuracion: { nombreEvento: 'Boda Concurrente', fechaEvento: '2026-10-15T20:00:00.000Z' },
  tareas: [{ id: 't_base', texto: 'Contratar fotógrafo', completada: false, asignadaA: 'Organizador' }],
  menuAsignadoId: 'menu_inicial',
  personalAsignado: [],
  decoracion: { tema: 'Vintage', itemsDecoracion: [] },
};

describe('Dos modulos de la fiesta no se pisan al guardar', () => {
  beforeEach(() => {
    for (const key of Object.keys(almacen)) delete almacen[key];
    almacen[FIESTA_PATH] = JSON.parse(JSON.stringify(FIESTA_INICIAL));
  });

  it('guardar tareas y menu al mismo tiempo conserva ambos cambios', async () => {
    const tareasNuevas = [
      { id: 't_base', texto: 'Contratar fotógrafo', completada: true, asignadaA: 'Organizador' },
      { id: 't_nueva', texto: 'Confirmar DJ', completada: false, asignadaA: 'Organizador' },
    ];
    const menuNuevoId = 'menu_asado_criollo_premium';

    // Se disparan en paralelo con demora simulada en la persistencia
    const [resTareas, resMenu] = await Promise.all([
      updateTareas(FIESTA_ID, tareasNuevas),
      updateMenuAsignado(FIESTA_ID, menuNuevoId),
    ]);

    expect(resTareas.success).toBe(true);
    expect(resMenu.success).toBe(true);

    const fiestaEnDisco = almacen[FIESTA_PATH];
    // Las tareas no deben pisar el menu asignado
    expect(fiestaEnDisco.menuAsignadoId).toEqual('menu_asado_criollo_premium');
    // El menu asignado no debe pisar las tareas
    expect(fiestaEnDisco.tareas).toHaveLength(2);
    expect(fiestaEnDisco.tareas[1].texto).toEqual('Confirmar DJ');
  });

  it('agregar una tarea y cambiar decoracion al mismo tiempo conserva ambas cosas', async () => {
    const [resAdd, resDeco] = await Promise.all([
      addTarea(FIESTA_ID, {
        texto: 'Revisar centros de mesa',
        descripcion: 'Verificar iluminación cálida',
        asignadaA: 'Decorador',
      }),
      updateDecoracion(FIESTA_ID, {
        tema: 'Moderno Elegante',
        itemsDecoracion: [{ id: 'arco_1', nombre: 'Arco Floral', categoria: 'arco', cantidad: 1 }],
      } as any),
    ]);

    expect(resAdd.success).toBe(true);
    expect(resDeco.success).toBe(true);

    const fiestaEnDisco = almacen[FIESTA_PATH];
    expect(fiestaEnDisco.decoracion.tema).toEqual('Moderno Elegante');
    expect(fiestaEnDisco.decoracion.itemsDecoracion).toHaveLength(1);
    expect(fiestaEnDisco.tareas.some((t: any) => t.texto === 'Revisar centros de mesa')).toBe(true);
  });
});
