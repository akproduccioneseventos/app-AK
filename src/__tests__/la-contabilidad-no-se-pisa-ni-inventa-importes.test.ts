/** @jest-environment node */
/**
 * MATAFUEGO — Revisión contable del 22/10/2026 (lo hizo Claude con ayudantes, por pedido del dueño):
 *
 * - Las cuentas automáticas de costos (lavandería, decoración, sincronizar todo) armaban los costos
 *   con una lectura de antes y guardaban todo: un costo cargado a mano en el medio desaparecía.
 * - Si el presupuesto no se podía leer al subir el contrato en papel, la seña caía en $20.000 y se
 *   emitía un recibo con un importe que nadie calculó.
 * - El texto del contrato se podía cambiar después de que el cliente lo firmó en su portal.
 *
 * La base de mentira devuelve COPIAS. Se probó rompiéndolo: con la escritura de antes (guardar los
 * costos leídos afuera), la resolución con $20.000 por defecto y sin mirar la constancia, se pone en rojo.
 */
jest.mock('server-only', () => ({}));
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

let fiesta: any;
let antesDeEscribir: (() => void) | null = null;
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, cambiar: (f: any) => any) => {
    if (antesDeEscribir) { antesDeEscribir(); antesDeEscribir = null; }
    const nueva = await cambiar(copia(fiesta));
    fiesta = copia(nueva);
    return { success: true, updatedFiesta: copia(nueva) };
  }),
}));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true, user: {} })),
  requirePermisoAlguno: jest.fn(async () => ({ ok: true, user: {} })),
}));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn(async () => fiesta) }));
const leerPresupuesto = jest.fn(async (_id: string): Promise<any> => null);
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestoById: (id: string) => leerPresupuesto(id) }));

import { syncLaundryCosts } from '@/app/actions/fiesta/costos.actions';
import { resolveDepositAmount } from '@/lib/fiesta/sena-del-contrato';

beforeEach(() => {
  fiesta = {
    id: 'f1', presupuestoId: 'p1', configuracion: { nombreEvento: 'XV de Sofía' },
    gestionCostos: { costosItems: [], ingresosTotalesEstimados: 0 },
  };
  antesDeEscribir = null;
  leerPresupuesto.mockReset();
});

describe('los costos automáticos no borran un costo cargado a mano en el medio', () => {
  it('lavandería: el costo manual que entró mientras se calculaba queda', async () => {
    antesDeEscribir = () => {
      fiesta.gestionCostos.costosItems.push({ id: 'manual_flete', nombre: 'Flete', category: 'Otros', montoEstimado: 3000 });
    };
    await syncLaundryCosts('f1', 100, [{ idServicioCatalogo: 'mantel', nombreServicio: 'Manteles', cantidad: 10 } as any]);
    const ids = fiesta.gestionCostos.costosItems.map((c: any) => c.id);
    expect(ids).toContain('manual_flete');
  });
});

describe('la seña del contrato en papel no se inventa', () => {
  it('con presupuesto que no se puede leer, no hay importe (no cae en $20.000)', async () => {
    leerPresupuesto.mockResolvedValue(null);
    expect(await resolveDepositAmount(fiesta)).toBeNull();
    leerPresupuesto.mockRejectedValue(new Error('La base no contesta'));
    expect(await resolveDepositAmount(fiesta)).toBeNull();
  });

  it('con el presupuesto leído, la seña sale de ahí', async () => {
    leerPresupuesto.mockResolvedValue({ id: 'p1', senia: 30000, totalConDescuento: 100000 });
    expect(await resolveDepositAmount(fiesta)).toBe(30000);
  });

  it('sin presupuesto en la fiesta, va el valor por defecto de siempre', async () => {
    expect(await resolveDepositAmount({ ...fiesta, presupuestoId: undefined })).toBe(20000);
    expect(leerPresupuesto).not.toHaveBeenCalled();
  });
});
