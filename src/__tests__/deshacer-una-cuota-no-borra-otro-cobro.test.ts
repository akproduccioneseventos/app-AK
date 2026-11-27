/**
 * Si falla guardar la cuota en la fiesta, se deshace SÓLO el cobro que se agregó al presupuesto
 * (revisión de la entrega 1475, 26/11/2026). Antes se volvía a poner la lista entera de cobros
 * leída al principio: un cobro que otra persona anotó en el medio desaparecía (pregunta 22).
 */
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined), requirePermiso: jest.fn(async () => ({ ok: true, user: {} })) }));
jest.mock('@/app/actions/google-workspace-extended', () => ({ notifyClientPaymentApproved: jest.fn(async () => undefined) }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ preserveFiestaSecrets: jest.fn(async (_id: string, f: any) => f) }));

const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let fiesta: any;
let presupuesto: any;

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  requireFiestaWriteAccess: jest.fn(async () => undefined),
  getFiestaById: jest.fn(async () => copia(fiesta)),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async () => {
    // Mientras tanto, otra persona anotó un cobro en el mismo presupuesto.
    presupuesto.pagosCliente.push({ id: 'otro', monto: 5000, estadoPago: 'confirmado', fecha: '2026-11-26' });
    return { success: false, error: 'La base no contestó.' };
  }),
}));
jest.mock('@/lib/budget/mutar-presupuesto', () => ({
  mutarPresupuesto: jest.fn(async (_id: string, cambiar: (p: any) => any) => {
    const nuevo = await cambiar(copia(presupuesto));
    if (nuevo) presupuesto = copia(nuevo);
    return { encontrado: true, presupuesto };
  }),
}));

import { updateCuotaEstado } from '@/app/actions/payment-plans';

beforeEach(() => {
  presupuesto = { id: 'p1', pagosCliente: [] };
  fiesta = {
    id: 'f1',
    presupuestoId: 'p1',
    planDePagos: { id: 'plan', fiestaId: 'f1', createdAt: '', updatedAt: '', cuotas: [
      { id: 'c1', descripcion: 'Cuota 1', monto: 1000, estado: 'pendiente', fechaVencimiento: '2026-12-01' },
    ] },
  };
});

describe('Deshacer una cuota no borra otro cobro', () => {
  it('si falla la fiesta, se saca el cobro de la cuota y queda el cobro del otro', async () => {
    const r = await updateCuotaEstado('f1', 'c1', { estado: 'pagado' });
    expect(r.success).toBe(false);
    const ids = presupuesto.pagosCliente.map((p: any) => p.id);
    expect(ids).toContain('otro');
    expect(ids).not.toContain('cuota_c1');
  });
});
