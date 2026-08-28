/**
 * LA LISTA DE COMPRAS Y EL MENÚ ASIGNADO
 *
 * Es comida y es plata: cuando se marca un pedido, la app tiene que abrir sola
 * la tarea de pagarle a ese proveedor, y cuando se marca pagado, cerrarla.
 * **No había ninguna prueba.** Si esto se rompe, un proveedor queda sin pagar y
 * nadie se entera.
 */

const guardado: { fiesta: any } = { fiesta: null };
const tareasAbiertas: any[] = [];
const datos: any = {};

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => datos.fiesta),
  saveFiesta: jest.fn(async (f: any) => {
    guardado.fiesta = f;
    return { success: true };
  }),
}));

jest.mock('@/app/actions/fiesta-actual', () => ({
  addTareaToFiestaActual: jest.fn(async (_id: string, tarea: any) => {
    tareasAbiertas.push(tarea);
  }),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => []),
  writeData: jest.fn(async () => undefined),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ email: 'admin@ak', role: 'admin' })),
}));

describe('Lista de compras y menú', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    guardado.fiesta = null;
    tareasAbiertas.length = 0;
    datos.fiesta = { id: 'f1', estadosCompra: [], tareas: [] };
  });

  it('al marcar un pedido sin pagar, la app abre sola la tarea de pagarle al proveedor', async () => {
    const { updateShoppingListStatus } = await import('@/app/actions/fiesta/catering.actions');

    const r = await updateShoppingListStatus('f1', [
      { proveedor: 'Carnicería Salto', pedido: true, pagado: false } as any,
    ]);

    expect(r.success).toBe(true);
    expect(tareasAbiertas).toHaveLength(1);
    expect(tareasAbiertas[0].texto).toBe('Pagar insumos a: Carnicería Salto');
  });

  it('si el pedido ya estaba marcado, no vuelve a abrir la misma tarea', async () => {
    datos.fiesta.estadosCompra = [{ proveedor: 'Carnicería Salto', pedido: true, pagado: false }];
    const { updateShoppingListStatus } = await import('@/app/actions/fiesta/catering.actions');

    await updateShoppingListStatus('f1', [
      { proveedor: 'Carnicería Salto', pedido: true, pagado: false } as any,
    ]);

    expect(tareasAbiertas).toHaveLength(0);
  });

  it('al marcar pagado, la tarea de pagar queda cerrada', async () => {
    datos.fiesta.estadosCompra = [{ proveedor: 'Carnicería Salto', pedido: true, pagado: false }];
    datos.fiesta.tareas = [
      { id: 't1', texto: 'Pagar insumos a: Carnicería Salto', completada: false },
    ];
    const { updateShoppingListStatus } = await import('@/app/actions/fiesta/catering.actions');

    await updateShoppingListStatus('f1', [
      { proveedor: 'Carnicería Salto', pedido: true, pagado: true } as any,
    ]);

    expect(guardado.fiesta.tareas[0].completada).toBe(true);
  });

  it('el estado de compras queda guardado tal como se mandó', async () => {
    const { updateShoppingListStatus } = await import('@/app/actions/fiesta/catering.actions');
    const estados = [{ proveedor: 'Verdulería', pedido: true, pagado: true } as any];

    await updateShoppingListStatus('f1', estados);

    expect(guardado.fiesta.estadosCompra).toEqual(estados);
  });

  it('cambiar el menú de la fiesta deja guardado el menú nuevo', async () => {
    const { updateMenuAsignado } = await import('@/app/actions/fiesta/catering.actions');

    await updateMenuAsignado('f1', 'menu-parrilla');

    expect(guardado.fiesta.menuAsignadoId).toBe('menu-parrilla');
  });
});
