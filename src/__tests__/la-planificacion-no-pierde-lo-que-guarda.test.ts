/**
 * MATAFUEGO de dos defectos de planificacion encontrados por Codex el 9 de
 * septiembre de 2026 y comprobados uno por uno.
 *
 * 1. Marcar un pedido como hecho creaba el recordatorio de pagarle al proveedor
 *    **y despues lo borraba**, porque se guardaba una copia de la fiesta leida antes.
 * 2. Al sacar TODA la decoracion, los gastos de la decoracion vieja quedaban
 *    cargados: el costo del evento seguia contando adornos que ya no estaban.
 */
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: {} }),
}));

const guardadas: any[] = [];
let fiestaGuardada: any = null;

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => JSON.parse(JSON.stringify(fiestaGuardada))),
  saveFiesta: jest.fn(async (f: any) => {
    guardadas.push(JSON.parse(JSON.stringify(f)));
    fiestaGuardada = JSON.parse(JSON.stringify(f));
    return { success: true, fiesta: f };
  }),
  updateFiestaPartial: jest.fn(async (id: string, partial: any) => {
    fiestaGuardada = { ...fiestaGuardada, ...JSON.parse(JSON.stringify(partial)) };
    guardadas.push(JSON.parse(JSON.stringify(fiestaGuardada)));
    return { success: true };
  }),
}));

const sincronizaciones: any[] = [];
jest.mock('@/app/actions/fiesta/costos.actions', () => ({
  updateGestionCostos: jest.fn(async (_id: string, costos: any) => {
    sincronizaciones.push(JSON.parse(JSON.stringify(costos)));
    fiestaGuardada = { ...fiestaGuardada, gestionCostos: costos };
    return { success: true };
  }),
  syncAllEventCosts: jest.fn(async () => ({ success: true })),
}));

import { updateShoppingListStatus } from '@/app/actions/fiesta/catering.actions';
import { updateDecoracion } from '@/app/actions/fiesta/decoracion.actions';

const FIESTA_BASE = {
  id: 'fiesta-plan-1',
  configuracion: { nombreEvento: 'Fiesta de prueba' },
  tareas: [],
  estadosCompra: [],
  decoracion: { itemsDecoracion: [] },
  gestionCostos: { costosItems: [], ingresosTotalesEstimados: 0 },
};

describe('La planificacion no pierde lo que dice guardar', () => {
  beforeEach(() => {
    guardadas.length = 0;
    sincronizaciones.length = 0;
    fiestaGuardada = JSON.parse(JSON.stringify(FIESTA_BASE));
  });

  it('marcar un pedido como hecho deja el recordatorio de pagarle al proveedor', async () => {
    const r = await updateShoppingListStatus(FIESTA_BASE.id, [
      { proveedor: 'Verduleria Salto', pedido: true, pagado: false } as any,
    ]);
    expect(r.success).toBe(true);

    const ultima = guardadas[guardadas.length - 1];
    const tarea = (ultima.tareas || []).find((t: any) => t.texto === 'Pagar insumos a: Verduleria Salto');
    expect(tarea).toBeTruthy();
    expect(tarea.completada).toBe(false);
  });

  it('volver a guardar el mismo pedido no duplica el recordatorio', async () => {
    const estados = [{ proveedor: 'Verduleria Salto', pedido: true, pagado: false } as any];
    await updateShoppingListStatus(FIESTA_BASE.id, estados);
    // Se cambia otra cosa para que el pedido se vuelva a evaluar.
    await updateShoppingListStatus(FIESTA_BASE.id, [
      { proveedor: 'Verduleria Salto', pedido: false, pagado: false } as any,
    ]);
    await updateShoppingListStatus(FIESTA_BASE.id, estados);

    const ultima = guardadas[guardadas.length - 1];
    const cuantas = (ultima.tareas || []).filter(
      (t: any) => t.texto === 'Pagar insumos a: Verduleria Salto' && !t.completada,
    ).length;
    expect(cuantas).toBe(1);
  });

  it('marcar el pedido como pagado completa el recordatorio', async () => {
    await updateShoppingListStatus(FIESTA_BASE.id, [
      { proveedor: 'Verduleria Salto', pedido: true, pagado: false } as any,
    ]);
    await updateShoppingListStatus(FIESTA_BASE.id, [
      { proveedor: 'Verduleria Salto', pedido: true, pagado: true } as any,
    ]);

    const ultima = guardadas[guardadas.length - 1];
    const tarea = (ultima.tareas || []).find((t: any) => t.texto === 'Pagar insumos a: Verduleria Salto');
    expect(tarea.completada).toBe(true);
  });

  it('sacar TODA la decoracion tambien saca sus gastos', async () => {
    // Primero, decoracion con un item que cuesta plata.
    await updateDecoracion(FIESTA_BASE.id, {
      itemsDecoracion: [
        { id: 'centro', nombre: 'Centro de mesa', cantidad: 10, costoUnitario: 500, categoria: 'Mesa' },
      ],
    } as any);
    expect(sincronizaciones[sincronizaciones.length - 1].costosItems).toHaveLength(1);

    // Ahora se saca todo.
    await updateDecoracion(FIESTA_BASE.id, { itemsDecoracion: [] } as any);

    const ultima = sincronizaciones[sincronizaciones.length - 1];
    expect(ultima.costosItems.filter((c: any) => String(c.id).startsWith('deco_'))).toHaveLength(0);
  });

  it('sacar la decoracion NO borra los otros gastos del evento', async () => {
    fiestaGuardada.gestionCostos = {
      costosItems: [{ id: 'personal_1', nombre: 'Mozos', montoEstimado: 8000, category: 'Personal' }],
      ingresosTotalesEstimados: 0,
    };

    await updateDecoracion(FIESTA_BASE.id, { itemsDecoracion: [] } as any);

    const ultima = sincronizaciones[sincronizaciones.length - 1];
    expect(ultima.costosItems.map((c: any) => c.id)).toContain('personal_1');
  });
});
