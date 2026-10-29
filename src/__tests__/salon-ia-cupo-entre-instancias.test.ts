/**
 * @jest-environment node
 *
 * Orden 253, R4 (Codex 751): el tope de 3 fotos del salón por fiesta tiene que valer
 * con DOS servidores. El turno de memoria de cada servidor no ve al otro: con dos fotos
 * ya hechas, los dos pedidos pasaban el tope, se pagaban dos imágenes y quedaban cuatro.
 *
 * Acá cada servidor es una copia aparte del módulo (su propio turno), y comparten una
 * base de mentira que, como la de verdad, entrega COPIAS y sólo confirma una transacción
 * si nadie escribió en el medio. Se comprobó que se pone en rojo si la reserva no cuenta
 * las pendientes.
 */

const compartido = {
  base: {} as Record<string, any>,
  generaciones: 0,
  consumos: 0,
};

function copia<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function armarServidor() {
  let modulo: typeof import('@/app/actions/fiesta/decoracion.actions') | undefined;
  jest.isolateModules(() => {
    jest.doMock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));
    jest.doMock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => true) }));
    jest.doMock('@/lib/ai/consumo-servidor', () => ({
      hayPresupuestoParaIA: jest.fn(async () => true),
      registrarConsumoIA: jest.fn(async () => { compartido.consumos += 1; }),
    }));
    jest.doMock('@/lib/ai/gemini-image', () => ({
      generateGeminiImage: jest.fn(async () => {
        compartido.generaciones += 1;
        await new Promise((r) => setTimeout(r, 25));
        return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      }),
    }));
    jest.doMock('@/lib/firebase/storage', () => ({
      uploadToStorageWithDownloadToken: jest.fn(async (_b: Buffer, ruta: string) => `https://storage.test/${ruta}`),
    }));
    jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({
      getFiestaById: jest.fn(async (id: string) => copia(compartido.base[id])),
      saveFiesta: jest.fn(async () => ({ success: true })),
      updateFiestaPartial: jest.fn(async () => ({ success: true })),
    }));
    jest.doMock('@/lib/fiesta/costos-interno', () => ({ mutarCostosInterno: async () => ({ success: true }) }));
    jest.doMock('@/lib/auth/equipo-de-la-fiesta', () => ({ usuarioDelEquipo: jest.fn(async () => null) }));
    jest.doMock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn(async () => ({})) }));
    jest.doMock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: jest.fn(async () => []) }));
    jest.doMock('@/lib/fiesta/actualizar-fiesta', () => ({
      actualizarFiesta: jest.fn(async (id: string, fn: (f: any) => any) => {
        for (let intento = 0; intento < 20; intento++) {
          const leida = compartido.base[id];
          if (!leida) return { success: false, error: 'No encontrada' };
          let nueva: any;
          try {
            nueva = await fn(copia(leida));
          } catch (e: any) {
            return { success: false, error: e.message };
          }
          // Entre leer y confirmar pasa tiempo: el otro servidor puede escribir.
          await new Promise((r) => setTimeout(r, 1));
          if (compartido.base[id] !== leida) continue;
          compartido.base[id] = copia(nueva);
          return { success: true, updatedFiesta: copia(nueva) };
        }
        return { success: false, error: 'Demasiados reintentos' };
      }),
    }));
    modulo = require('@/app/actions/fiesta/decoracion.actions');
  });
  return modulo!;
}

const CAPTURA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('el cupo de fotos del salón vale entre dos servidores', () => {
  beforeEach(() => {
    compartido.base = {
      f1: { id: 'f1', decoracion: { fotosGeneradasAi: ['una.png', 'dos.png'] } },
    };
    compartido.generaciones = 0;
    compartido.consumos = 0;
  });

  it('con un solo lugar libre, dos servidores a la vez pagan y guardan UNA foto', async () => {
    const servidorA = armarServidor();
    const servidorB = armarServidor();

    const [a, b] = await Promise.all([
      servidorA.generarVisualizacionSalonAi('f1', undefined, CAPTURA),
      servidorB.generarFotoDelSalonDesdeElPortal('f1', CAPTURA),
    ]);

    expect([a.success, b.success].filter(Boolean)).toHaveLength(1);
    const rechazado = a.success ? b : a;
    expect(rechazado.error).toMatch(/tope de 3/i);
    expect(compartido.generaciones).toBe(1);
    expect(compartido.consumos).toBe(1);
    expect(compartido.base.f1.decoracion.fotosGeneradasAi).toHaveLength(3);
    expect(compartido.base.f1.decoracion.fotosSalonAiPendientes).toEqual([]);
  });
});
