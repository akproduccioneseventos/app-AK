/**
 * Dos cuotas marcadas a la vez no se pisan (Codex, área "cobros", 2/10/2026, COB-02).
 *
 * `updateCuotaEstado` leía la fiesta, armaba la lista entera de cuotas y la guardaba: dos cuotas
 * marcadas a la vez decían "cobrada" las dos, mandaban dos mails, y quedaba pagada una sola. Ahora
 * cada cambio relee la fiesta adentro del turno, y el mail sale sólo si esa cuota pasó de verdad
 * de no-pagada a pagada. La base de mentira devuelve COPIAS y tarda (error 11).
 */
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined), requirePermiso: jest.fn(async () => ({ ok: true, user: {} })) }));
const avisos = jest.fn(async () => undefined);
jest.mock('@/app/actions/google-workspace-extended', () => ({ notifyClientPaymentApproved: (...a: any[]) => (avisos as any)(...a) }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ preserveFiestaSecrets: jest.fn(async (_id: string, f: any) => f) }));

let fiesta: any;
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((r) => setTimeout(r, 15));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  requireFiestaWriteAccess: jest.fn(async () => undefined),
  getFiestaById: jest.fn(async () => copia(fiesta)),
  saveFiesta: jest.fn(async (f: any) => { await esperar(); fiesta = copia(f); return { success: true }; }),
}));
// La transacción de la base: lee y guarda de a una operación por vez, sobre copias.
let turno: Promise<unknown> = Promise.resolve();
jest.mock('@/lib/generic-json-store', () => ({
  mutarDocumentoConTransaccion: jest.fn((_p: string, _v: any, cambiar: (a: any) => any) => {
    const r = turno.then(async () => {
      const nuevo = await cambiar(copia(fiesta));
      await esperar();
      if (nuevo !== null) fiesta = copia(nuevo);
      return nuevo;
    });
    turno = r.catch(() => undefined);
    return r;
  }),
}));

import { updateCuotaEstado } from '@/app/actions/payment-plans';

beforeEach(() => {
  avisos.mockClear();
  fiesta = {
    id: 'f1',
    planDePagos: {
      id: 'plan', fiestaId: 'f1', createdAt: '', updatedAt: '',
      cuotas: [
        { id: 'c1', descripcion: 'Cuota 1', monto: 1000, estado: 'pendiente', fechaVencimiento: '2026-11-01' },
        { id: 'c2', descripcion: 'Cuota 2', monto: 1000, estado: 'pendiente', fechaVencimiento: '2026-12-01' },
      ],
    },
  };
});

describe('Dos cuotas a la vez no se pisan', () => {
  it('dos cuotas distintas marcadas a la vez quedan las dos pagadas', async () => {
    const [a, b] = await Promise.all([
      updateCuotaEstado('f1', 'c1', { estado: 'pagado' }),
      updateCuotaEstado('f1', 'c2', { estado: 'pagado' }),
    ]);
    expect(a.success && b.success).toBe(true);
    expect(fiesta.planDePagos.cuotas.map((c: any) => c.estado)).toEqual(['pagado', 'pagado']);
    expect(avisos).toHaveBeenCalledTimes(2);
  });

  it('la misma cuota marcada dos veces manda un solo mail', async () => {
    await Promise.all([
      updateCuotaEstado('f1', 'c1', { estado: 'pagado' }),
      updateCuotaEstado('f1', 'c1', { estado: 'pagado' }),
    ]);
    expect(avisos).toHaveBeenCalledTimes(1);
  });
});
