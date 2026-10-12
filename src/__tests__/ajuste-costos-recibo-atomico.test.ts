type Doc = Record<string, any>;

const mockState = {
  documentos: new Map<string, Doc>(),
  estado: { cola: Promise.resolve() as Promise<unknown>, fallarAntesDeCommit: false },
};
const { documentos, estado } = mockState;

const copiar = <T,>(valor: T): T => {
  if (Array.isArray(valor)) return valor.map(copiar) as T;
  if (valor && typeof valor === 'object') return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, copiar(v)])) as T;
  return valor;
};
const clave = (coleccion: string, id: string) => `${coleccion}/${id}`;

function referencia(coleccion: string, id: string) {
  return {
    id,
    path: clave(coleccion, id),
    get: async () => snapshot(id, documentos.get(clave(coleccion, id))),
  };
}

function snapshot(id: string, datos?: Doc) {
  const lectura = datos === undefined ? undefined : copiar(datos);
  return { id, exists: lectura !== undefined, data: () => lectura && copiar(lectura) };
}

const mockDb = {
  collection: (coleccion: string) => ({
    doc: (id: string) => referencia(coleccion, id),
    get: async () => {
      const docs = [...documentos.entries()]
        .filter(([path]) => path.startsWith(`${coleccion}/`))
        .map(([path, datos]) => ({ ...snapshot(path.slice(coleccion.length + 1), datos), ref: referencia(coleccion, path.slice(coleccion.length + 1)) }));
      return { docs, size: docs.length, empty: docs.length === 0 };
    },
    name: coleccion,
  }),
  runTransaction: (ejecutar: (tx: any) => Promise<any>) => {
    const trabajo = estado.cola.then(async () => {
      const staged = new Map<string, Doc | null>();
      const leer = (ref: { path: string; id: string }) => staged.has(ref.path) ? staged.get(ref.path) ?? undefined : documentos.get(ref.path);
      const tx = {
        get: async (destino: any) => {
          if (destino.path) return snapshot(destino.id, leer(destino));
          const docs = [...documentos.entries()].filter(([path]) => path.startsWith(`${destino.name}/`)).map(([path, datos]) => {
            const ref = referencia(destino.name, path.slice(destino.name.length + 1));
            return { ...snapshot(ref.id, leer(ref)), ref };
          }).filter(doc => doc.exists);
          return { docs, size: docs.length, empty: docs.length === 0 };
        },
        create: (ref: any, datos: Doc) => { if (leer(ref)) throw new Error('document already exists'); staged.set(ref.path, copiar(datos)); },
        update: (ref: any, datos: Doc) => { const previo = leer(ref); if (!previo) throw new Error('document does not exist'); staged.set(ref.path, { ...previo, ...copiar(datos) }); },
        set: (ref: any, datos: Doc) => staged.set(ref.path, copiar(datos)),
        delete: (ref: any) => staged.set(ref.path, null),
      };
      const resultado = await ejecutar(tx);
      if (estado.fallarAntesDeCommit) throw new Error('fallo simulado antes del commit');
      for (const [path, datos] of staged) datos === null ? documentos.delete(path) : documentos.set(path, copiar(datos));
      return resultado;
    });
    estado.cola = trabajo.then(() => undefined, () => undefined);
    return trabajo;
  },
};

let api: typeof import('@/lib/insumos/ajuste-costos-idempotente');
let comenzarAjusteCostos: typeof import('@/lib/insumos/ajuste-costos-idempotente').comenzarAjusteCostos;
let terminarAjusteCostos: typeof import('@/lib/insumos/ajuste-costos-idempotente').terminarAjusteCostos;
let cambiarMenuDuranteAjuste: typeof import('@/lib/insumos/ajuste-costos-idempotente').cambiarMenuDuranteAjuste;
let AjusteNoIniciadoError: typeof import('@/lib/insumos/ajuste-costos-idempotente').AjusteNoIniciadoError;

describe('recibo atomico de ajuste de costos de insumos', () => {
  beforeAll(() => {
    jest.doMock('@/lib/firebase/server', () => ({ dbAdmin: mockDb }));
    api = require('@/lib/insumos/ajuste-costos-idempotente');
    ({ comenzarAjusteCostos, terminarAjusteCostos, cambiarMenuDuranteAjuste, AjusteNoIniciadoError } = api);
  });

  beforeEach(() => {
    documentos.clear();
    estado.cola = Promise.resolve();
    estado.fallarAntesDeCommit = false;
    documentos.set('insumos/a', { valorUnitarioEstimado: 10.01 });
    documentos.set('insumos/b', { valorUnitarioEstimado: 3.33 });
  });

  it('repetir una operacion terminada no vuelve a multiplicar y conserva el redondeo existente a pesos', async () => {
    const primera = await comenzarAjusteCostos(10, 'op-repetida');
    expect(documentos.get('insumos/a')?.valorUnitarioEstimado).toBe(Math.round(10.01 * 1.1));
    expect(documentos.get('insumos/b')?.valorUnitarioEstimado).toBe(Math.round(3.33 * 1.1));
    await terminarAjusteCostos('op-repetida');
    const segunda = await comenzarAjusteCostos(10, 'op-repetida');
    expect(segunda).toMatchObject({ porcentaje: primera.porcentaje, ids: primera.ids, terminado: true });
    expect(documentos.get('insumos/a')?.valorUnitarioEstimado).toBe(11);
    expect(documentos.get('insumos/b')?.valorUnitarioEstimado).toBe(4);
  });

  it('dos solicitudes simultaneas con el mismo id y porcentaje multiplican una sola vez', async () => {
    await Promise.all([comenzarAjusteCostos(10, 'op-doble'), comenzarAjusteCostos(10, 'op-doble')]);
    expect(documentos.get('insumos/a')?.valorUnitarioEstimado).toBe(11);
    expect(documentos.get('insumos/b')?.valorUnitarioEstimado).toBe(4);
  });

  it('serializa dos payloads simultaneos con el mismo id y solo aplica el primero', async () => {
    const resultados = await Promise.all([
      comenzarAjusteCostos(10, 'op-concurrente'),
      comenzarAjusteCostos(25, 'op-concurrente'),
    ].map(p => p.then(value => ({ value }), error => ({ error }))));
    expect(resultados.filter(r => 'value' in r)).toHaveLength(1);
    expect(resultados.filter(r => 'error' in r)[0].error).toBeInstanceOf(AjusteNoIniciadoError);
    expect(documentos.get('insumos/a')?.valorUnitarioEstimado).toBe(11);
  });

  it('rechaza otro id mientras hay un recibo pendiente sin modificar el catalogo', async () => {
    await comenzarAjusteCostos(10, 'op-uno');
    const antes = copiar([...documentos.entries()].filter(([path]) => path.startsWith('insumos/')));
    await expect(comenzarAjusteCostos(20, 'op-dos')).rejects.toBeInstanceOf(AjusteNoIniciadoError);
    expect([...documentos.entries()].filter(([path]) => path.startsWith('insumos/'))).toEqual(antes);
    expect([...documentos.keys()].filter(path => path.startsWith('ajustes_costos_insumos/'))).toHaveLength(2);
  });

  it('al terminar libera el turno y otro id aplica intencionalmente el porcentaje de nuevo', async () => {
    await comenzarAjusteCostos(10, 'op-uno');
    await terminarAjusteCostos('op-uno');
    await comenzarAjusteCostos(10, 'op-dos');
    expect(documentos.get('insumos/a')?.valorUnitarioEstimado).toBe(Math.round(11 * 1.1));
    expect(documentos.get('insumos/b')?.valorUnitarioEstimado).toBe(Math.round(4 * 1.1));
  });

  it('si la transaccion falla antes del commit no cambia insumos ni recibos', async () => {
    const antes = copiar([...documentos.entries()]);
    estado.fallarAntesDeCommit = true;
    await expect(comenzarAjusteCostos(10, 'op-falla')).rejects.toThrow('fallo simulado antes del commit');
    expect([...documentos.entries()]).toEqual(antes);
  });

  it('rechaza costos invalidos y catalogos vacios', async () => {
    documentos.set('insumos/malo', { valorUnitarioEstimado: Number.POSITIVE_INFINITY });
    await expect(comenzarAjusteCostos(10, 'op-invalido')).rejects.toBeInstanceOf(AjusteNoIniciadoError);
    documentos.delete('insumos/malo');
    documentos.delete('insumos/a');
    documentos.delete('insumos/b');
    await expect(comenzarAjusteCostos(10, 'op-vacio')).rejects.toBeInstanceOf(AjusteNoIniciadoError);
  });

  it('recibos antiguos con pendientesAnteriores no vuelven a aplicar costos', async () => {
    documentos.set('ajustes_costos_insumos/legacy', { porcentaje: 10, ids: ['a'], terminado: true });
    await comenzarAjusteCostos(10, 'op-migrado', ['a']);
    expect(documentos.get('insumos/a')?.valorUnitarioEstimado).toBe(10.01);
    expect(documentos.get('insumos/b')?.valorUnitarioEstimado).toBe(3.33);
  });

  it('rechaza reutilizar el mismo operationId con otro porcentaje', async () => {
    await comenzarAjusteCostos(10, 'op-payload');
    await expect(comenzarAjusteCostos(11, 'op-payload')).rejects.toBeInstanceOf(AjusteNoIniciadoError);
    expect(documentos.get('insumos/a')?.valorUnitarioEstimado).toBe(11);
  });

  it('un intento lento de A ya terminado no pisa el menu que guardo B', async () => {
    documentos.set('menus_catering/menu-1', { nombre: 'Menu inicial', precio: 100 });
    await comenzarAjusteCostos(10, 'menu-op-a');
    await terminarAjusteCostos('menu-op-a');
    await comenzarAjusteCostos(20, 'menu-op-b');
    await cambiarMenuDuranteAjuste('menu-op-b', 'menu-1', actual => ({ ...actual, nombre: 'Guardado por B', precio: 200 } as any));
    const luegoDeB = copiar(documentos.get('menus_catering/menu-1'));

    await cambiarMenuDuranteAjuste('menu-op-a', 'menu-1', actual => ({ ...actual, nombre: 'Sobrescrito por A', precio: 999 } as any));

    expect(documentos.get('menus_catering/menu-1')).toEqual(luegoDeB);
    expect(documentos.get('menus_catering/menu-1')?.nombre).toBe('Guardado por B');
  });
});
