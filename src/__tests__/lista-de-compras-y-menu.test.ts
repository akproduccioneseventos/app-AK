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
  updateFiestaPartial: jest.fn(async (id: string, partial: any) => {
    guardado.fiesta = { ...(guardado.fiesta || datos.fiesta), ...partial };
    return { success: true };
  }),
}));

/**
 * ESTA PRUEBA MIRABA EL INGREDIENTE Y NO EL RESULTADO, Y SE CORRIGIO EL 9 DE
 * SEPTIEMBRE DE 2026.
 *
 * Comprobaba que se **llamara** al modulo de tareas. Y se llamaba: la tarea se
 * creaba... y dos lineas mas abajo la app guardaba una copia vieja de la fiesta que
 * la borraba. **La prueba daba verde mientras el recordatorio de pagarle al
 * proveedor se perdia.**
 *
 * Ahora mira lo unico que importa: **que la tarea quede en la fiesta guardada.**
 */

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
    const tareasGuardadas = (guardado.fiesta?.tareas || []).filter((t: any) => !t.completada);
    expect(tareasGuardadas).toHaveLength(1);
    expect(tareasGuardadas[0].texto).toBe('Pagar insumos a: Carnicería Salto');
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
