/** @jest-environment node */

import { NextRequest } from 'next/server';

describe('Voz en vivo - Un intento en dos servidores', () => {
  const storeGlobal = new Map<string, any[]>();

  beforeEach(() => {
    storeGlobal.clear();
    storeGlobal.set('asistente-intentos-voz.json', []);
    storeGlobal.set('tasks.json', []);
  });

  test('mismo actor, id y carga en dos servidores concurrentes crea una sola tarea', async () => {
    let postModulo1: any;
    let postModulo2: any;

    const mockMutate = async (filePath: string, cambiar: (lista: any[]) => any[] | null) => {
      // Simula transacción atómica en base de datos: relee copia actual, aplica cambiar, guarda copia
      const actual = JSON.parse(JSON.stringify(storeGlobal.get(filePath) || []));
      const nueva = cambiar(actual);
      if (nueva !== null) {
        storeGlobal.set(filePath, JSON.parse(JSON.stringify(nueva)));
      }
      return nueva;
    };

    jest.isolateModules(() => {
      jest.doMock('@/lib/auth/equipo-de-la-fiesta', () => ({
        usuarioDelEquipo: jest.fn(async () => ({
          email: 'organizador@ak.com',
          userId: 'user-456',
        })),
      }));
      jest.doMock('@/lib/auth/perfiles', () => ({
        puede: jest.fn(() => true),
        PERMISOS: { ORGANIZACION: 'organizacion', CONTABILIDAD: 'contabilidad', ADMINISTRACION: 'admin' },
      }));
      jest.doMock('@/lib/asistente/que-puede-hacer-solo', () => ({
        nivelDeRiesgo: jest.fn(() => 'seguro'),
        registrarAccionAsistente: jest.fn(async () => {}),
      }));
      jest.doMock('@/lib/generic-json-store', () => ({
        mutateGenericJsonArray: jest.fn(mockMutate),
      }));

      const route1 = require('@/app/api/asistente/voz-en-vivo/accion/route');
      postModulo1 = route1.POST;
    });

    jest.isolateModules(() => {
      jest.doMock('@/lib/auth/equipo-de-la-fiesta', () => ({
        usuarioDelEquipo: jest.fn(async () => ({
          email: 'organizador@ak.com',
          userId: 'user-456',
        })),
      }));
      jest.doMock('@/lib/auth/perfiles', () => ({
        puede: jest.fn(() => true),
        PERMISOS: { ORGANIZACION: 'organizacion', CONTABILIDAD: 'contabilidad', ADMINISTRACION: 'admin' },
      }));
      jest.doMock('@/lib/asistente/que-puede-hacer-solo', () => ({
        nivelDeRiesgo: jest.fn(() => 'seguro'),
        registrarAccionAsistente: jest.fn(async () => {}),
      }));
      jest.doMock('@/lib/generic-json-store', () => ({
        mutateGenericJsonArray: jest.fn(mockMutate),
      }));

      const route2 = require('@/app/api/asistente/voz-en-vivo/accion/route');
      postModulo2 = route2.POST;
    });

    expect(postModulo1).toBeDefined();
    expect(postModulo2).toBeDefined();

    const body = {
      id: 'pedido-voz-duplicado-123',
      accion: 'crear_tarea',
      argumentos: { titulo: 'Comprar hielo para la fiesta' },
    };

    const req1 = new NextRequest('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const req2 = new NextRequest('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const [res1, res2] = await Promise.all([
      postModulo1(req1),
      postModulo2(req2),
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    expect(data1.success).toBe(true);
    expect(data2.success).toBe(true);

    const tareas = storeGlobal.get('tasks.json') || [];
    // Una sola tarea creada a pesar de llegar dos pedidos idénticos en dos servidores
    expect(tareas).toHaveLength(1);
    expect(tareas[0].title).toBe('Comprar hielo para la fiesta');

    // El estado del intento en el almacén transaccional quedó en 'hecho'
    const intentos = storeGlobal.get('asistente-intentos-voz.json') || [];
    expect(intentos).toHaveLength(1);
    expect(intentos[0].estado).toBe('hecho');
    expect(intentos[0].clave).toBe('user-456:crear_tarea:pedido-voz-duplicado-123');
  }, 15000);

  test('si la base repite la transacción porque otro servidor ya anotó el intento, no se crea la tarea', async () => {
    // Firestore vuelve a llamar a la función si otro escribió en el medio. El primer intento vio la lista
    // vacía y se creyó primero; lo que anotó ese intento descartado no puede quedar (21/10/2026).
    let primera = true;
    const mutateConReintento = async (filePath: string, cambiar: (lista: any[]) => any[] | null) => {
      if (filePath === 'asistente-intentos-voz.json' && primera) {
        primera = false;
        cambiar(JSON.parse(JSON.stringify(storeGlobal.get(filePath) || [])));
        storeGlobal.set(filePath, [{ clave: 'user-456:crear_tarea:pedido-123', estado: 'hecho', resultado: { success: true, deOtroServidor: true } }]);
      }
      const nueva = cambiar(JSON.parse(JSON.stringify(storeGlobal.get(filePath) || [])));
      if (nueva !== null) storeGlobal.set(filePath, JSON.parse(JSON.stringify(nueva)));
      return nueva;
    };
    let post: any;
    jest.isolateModules(() => {
      jest.doMock('@/lib/auth/equipo-de-la-fiesta', () => ({ usuarioDelEquipo: jest.fn(async () => ({ email: 'o@ak.com', userId: 'user-456' })) }));
      jest.doMock('@/lib/auth/perfiles', () => ({ puede: jest.fn(() => true), PERMISOS: { ORGANIZACION: 'organizacion', CONTABILIDAD: 'contabilidad', ADMINISTRACION: 'admin' } }));
      jest.doMock('@/lib/asistente/que-puede-hacer-solo', () => ({ nivelDeRiesgo: jest.fn(() => 'seguro'), registrarAccionAsistente: jest.fn(async () => {}) }));
      jest.doMock('@/lib/generic-json-store', () => ({ mutateGenericJsonArray: jest.fn(mutateConReintento) }));
      post = require('@/app/api/asistente/voz-en-vivo/accion/route').POST;
    });
    const res = await post(new NextRequest('http://localhost/api/asistente/voz-en-vivo/accion', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'pedido-123', accion: 'crear_tarea', argumentos: { titulo: 'Hielo' } }),
    }));
    expect((await res.json()).deOtroServidor).toBe(true);
    expect(storeGlobal.get('tasks.json')).toHaveLength(0);
  }, 15000);
});
