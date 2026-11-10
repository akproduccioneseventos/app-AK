/** @jest-environment node */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/firebase/server', () => ({ dbAdmin: null }));

const almacen: Record<string, any> = {};

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    // Delay para simular latencia de E/S
    await new Promise((resolve) => setTimeout(resolve, 25));
    const norm = archivo.replace(/\\/g, '/');
    const guardado = almacen[norm];
    return guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado));
  }),
  readDataConDetalle: jest.fn(async (archivo: string, porDefecto: any) => {
    await new Promise((resolve) => setTimeout(resolve, 25));
    const norm = archivo.replace(/\\/g, '/');
    const guardado = almacen[norm];
    return {
      valor: guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado)),
      huboFalla: false,
    };
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    await new Promise((resolve) => setTimeout(resolve, 25));
    const norm = archivo.replace(/\\/g, '/');
    almacen[norm] = JSON.parse(JSON.stringify(datos));
  }),
}));

import { guardarReglaIA, getReglaParaTarea } from '@/lib/ia/reglas-de-la-ia';

describe('Orden 270 (Bloque 6): dos reglas de la IA guardadas a la vez no se pisan', () => {
  beforeEach(() => {
    for (const key of Object.keys(almacen)) {
      delete almacen[key];
    }
  });

  test('dos guardados concurrentes de reglas distintas persisten ambas', async () => {
    // Lanzamos dos escrituras al mismo tiempo sobre reglas distintas
    const [res1, res2] = await Promise.all([
      guardarReglaIA('anticipador', 'apagada', 'dueno'),
      guardarReglaIA('resumen_de_la_manana', 'preguntar', 'dueno'),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);

    const regla1 = await getReglaParaTarea('anticipador');
    const regla2 = await getReglaParaTarea('resumen_de_la_manana');

    expect(regla1).toBe('apagada');
    expect(regla2).toBe('preguntar');

    const archivoGuardado = almacen['reglas-de-la-ia.json'];
    expect(archivoGuardado).toBeDefined();
    expect(archivoGuardado['anticipador']).toBe('apagada');
    expect(archivoGuardado['resumen_de_la_manana']).toBe('preguntar');
  });

  test('cinco escrituras simultaneas no pierden ninguna regla', async () => {
    const tareas = [
      { id: 'anticipador', modo: 'preguntar' as const },
      { id: 'resumen_de_la_manana', modo: 'apagada' as const },
      { id: 'borradores_redes_posfiesta', modo: 'preguntar' as const },
      { id: 'vigilante_noche', modo: 'preguntar' as const },
      { id: 'generador_contenido', modo: 'apagada' as const },
    ];

    const resultados = await Promise.all(
      tareas.map((t) => guardarReglaIA(t.id, t.modo, 'dueno'))
    );

    for (const res of resultados) {
      expect(res.success).toBe(true);
    }

    const archivoGuardado = almacen['reglas-de-la-ia.json'];
    expect(archivoGuardado).toBeDefined();

    for (const t of tareas) {
      expect(archivoGuardado[t.id]).toBe(t.modo);
      const modoLeido = await getReglaParaTarea(t.id);
      expect(modoLeido).toBe(t.modo);
    }
  });

  test('el patron viejo sin mutex perdia escrituras concurrentes demostrando la necesidad de mutarDocumento', async () => {
    const { readData: readFn, writeData: writeFn } = jest.requireMock('@/lib/data-service');

    async function guardarSinMutex(tareaId: string, modo: string) {
      const guardadas = await readFn('reglas-de-la-ia.json', {});
      const actualizadas = { ...guardadas, [tareaId]: modo };
      await writeFn('reglas-de-la-ia.json', actualizadas);
    }

    await Promise.all([
      guardarSinMutex('tarea_a', 'sola'),
      guardarSinMutex('tarea_b', 'apagada'),
    ]);

    const resultadoSinMutex = almacen['reglas-de-la-ia.json'];
    const tieneAmbas = !!(resultadoSinMutex?.tarea_a && resultadoSinMutex?.tarea_b);
    expect(tieneAmbas).toBe(false);
  });
});
