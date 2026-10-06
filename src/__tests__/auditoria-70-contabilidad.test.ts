/** @jest-environment node */
/**
 * MATAFUEGO — Los seis fallos contables de la auditoría 70 de Codex (6/10/2026).
 *
 * COB10 personal anotaba y borraba cobros · GAS01 personal leía, cargaba y borraba gastos ·
 * GAS02 dos reintentos a la vez guardaban el gasto dos veces · GAS03 NaN/Infinity se guardaban ·
 * PLAN01 guardar un plan viejo deshacía una cuota pagada · LEDGER01 el panel daba saldo cero con
 * el ajuste anual por cobrar.
 *
 * Se probó rompiéndolo: volviendo cada acción a "alcanza con la sesión", quitando la llave fija
 * del gasto, el control de cobro en el plan, y el total cobrable del libro, cada bloque da rojo.
 */
let perfil = 'personal';
const docs = new Map<string, any>();
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let fiesta: any;

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({ success: true, user: { userId: 'u1', email: 'u@ak.test', perfil } })),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, d: any) => (archivo === 'gastos-generales.json' ? [...docs.values()].map(copia) : d)),
  writeData: jest.fn(),
  // Como la base: `create` falla si el documento ya existe. Se espera un turno para que los dos
  // pedidos lleguen "a la vez".
  createDataItem: jest.fn(async (_f: string, _c: string, id: string, item: any) => {
    await new Promise((r) => setTimeout(r, 5));
    if (docs.has(id)) throw new Error('ALREADY_EXISTS');
    docs.set(id, copia(item));
  }),
  deleteDataItem: jest.fn(async (_f: string, _c: string, id: string) => docs.delete(id)),
  mutateDataItem: jest.fn(),
  updateDataItem: jest.fn(),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, cambiar: (f: any) => any) => {
    try {
      fiesta = copia(await cambiar(copia(fiesta)));
      return { success: true, updatedFiesta: fiesta };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => copia(fiesta)),
  saveFiesta: jest.fn(async (f: any) => { fiesta = copia(f); return { success: true }; }),
}));
jest.mock('@/app/actions/google-workspace-extended', () => ({ notifyClientPaymentApproved: jest.fn(async () => undefined) }));

import { addPagoToPresupuesto, deletePagoFromPresupuesto, confirmPagoCliente, rejectPagoCliente } from '@/app/actions/presupuestos';
import { getGastosGenerales, saveGastoGeneral, deleteGastoGeneral } from '@/app/actions/gastos';
import { savePlanDePagos } from '@/app/actions/payment-plans';
import { calculateFinancialLedger } from '@/lib/commercial-flow/ledger-service';
import { getBudgetPaymentSummary } from '@/lib/budget/financial-guardrails';
import { mutateDataItem } from '@/lib/data-service';

beforeEach(() => {
  docs.clear();
  perfil = 'personal';
  (mutateDataItem as jest.Mock).mockClear();
});

const GASTO = { concepto: 'Luz', fecha: '2026-10-06', categoria: 'Servicios Públicos (Luz, Agua, etc.)' as const, monto: 100 };

describe('COB10: los cobros son de contabilidad', () => {
  it.each(['personal', 'operador'])('%s no anota, borra, confirma ni rechaza cobros', async (p) => {
    perfil = p;
    expect((await addPagoToPresupuesto('b', { monto: 1000, fecha: '2026-10-06', metodoPago: 'Efectivo' } as any)).success).toBe(false);
    expect((await deletePagoFromPresupuesto('b', 'x')).success).toBe(false);
    expect((await confirmPagoCliente('b', 'x')).success).toBe(false);
    expect((await rejectPagoCliente('b', 'x', 'no')).success).toBe(false);
    expect(mutateDataItem).not.toHaveBeenCalled();
  });
});

describe('GAS01: los gastos son de contabilidad', () => {
  it('el personal no lee, no carga ni borra', async () => {
    await expect(getGastosGenerales()).rejects.toThrow();
    expect((await saveGastoGeneral(GASTO)).success).toBe(false);
    expect((await deleteGastoGeneral('g1')).success).toBe(false);
    expect(docs.size).toBe(0);
  });

  it('la secretaria carga y lee, pero no ve los sueldos administrativos', async () => {
    perfil = 'dueno';
    await saveGastoGeneral({ ...GASTO, categoria: 'Sueldos Administrativos', concepto: 'Sueldo admin' });
    perfil = 'secretaria';
    await saveGastoGeneral(GASTO);
    const vistos = await getGastosGenerales();
    expect(vistos.map((g) => g.concepto)).toEqual(['Luz']);
  });
});

describe('GAS02 y GAS03: un gasto es uno, y es un número', () => {
  it('dos reintentos a la vez con la misma llave guardan uno solo', async () => {
    perfil = 'secretaria';
    const [a, b] = await Promise.all([
      saveGastoGeneral({ ...GASTO, idempotencyKey: 'mant:1' }),
      saveGastoGeneral({ ...GASTO, idempotencyKey: 'mant:1' }),
    ]);
    expect(a.success && b.success).toBe(true);
    expect(docs.size).toBe(1);
    expect(a.gasto?.id).toBe(b.gasto?.id);
  });

  it('la misma llave con otro importe no se toma por el mismo gasto', async () => {
    perfil = 'secretaria';
    await saveGastoGeneral({ ...GASTO, idempotencyKey: 'mant:2' });
    const otro = await saveGastoGeneral({ ...GASTO, monto: 999, idempotencyKey: 'mant:2' });
    expect(otro.success).toBe(false);
  });

  it('dos gastos distintos del mismo monto y día siguen siendo dos', async () => {
    perfil = 'secretaria';
    await saveGastoGeneral(GASTO);
    await saveGastoGeneral(GASTO);
    expect(docs.size).toBe(2);
  });

  it.each([NaN, Infinity, -5, 0])('monto %p se rechaza antes de guardar', async (monto) => {
    perfil = 'secretaria';
    expect((await saveGastoGeneral({ ...GASTO, monto })).success).toBe(false);
    expect(docs.size).toBe(0);
  });
});

describe('PLAN01: guardar el plan no deshace un cobro', () => {
  const cuota = (extra: any = {}) => ({ id: 'c1', descripcion: 'Cuota 1', monto: 1000, fechaVencimiento: '2026-11-01', estado: 'pendiente', ...extra });

  beforeEach(() => {
    perfil = 'secretaria';
    fiesta = { id: 'f1', planDePagos: { id: 'p', fiestaId: 'f1', cuotas: [cuota({ estado: 'pagado', montoPagado: 1000 })], createdAt: 'a', updatedAt: 'v2' } };
  });

  it('con la versión vieja, pide recargar y la cuota sigue pagada', async () => {
    const r = await savePlanDePagos('f1', { cuotas: [cuota()] as any, notas: 'nota nueva', versionLeida: 'v1' });
    expect(r.success).toBe(false);
    expect(fiesta.planDePagos.cuotas[0].estado).toBe('pagado');
  });

  it('sin versión, lo cobrado se conserva aunque llegue pendiente', async () => {
    const r = await savePlanDePagos('f1', { cuotas: [cuota()] as any, notas: 'otra' });
    expect(r.success).toBe(true);
    expect(fiesta.planDePagos.cuotas[0].estado).toBe('pagado');
    expect(fiesta.planDePagos.cuotas[0].montoPagado).toBe(1000);
    expect(fiesta.planDePagos.notas).toBe('otra');
  });

  it('una cuota con cobro no se saca del plan', async () => {
    expect((await savePlanDePagos('f1', { cuotas: [], notas: '' })).success).toBe(false);
    expect(fiesta.planDePagos.cuotas).toHaveLength(1);
  });

  it('el personal no toca el plan', async () => {
    perfil = 'personal';
    expect((await savePlanDePagos('f1', { cuotas: [], notas: '' })).success).toBe(false);
  });
});

describe('LEDGER01: el libro y el resumen dicen el mismo saldo', () => {
  const base = { id: 'b', estado: 'Aceptado', timestamp: '2026-01-01', fechaFirmaContrato: '2026-01-01', totalConDescuento: 100000, ajusteAnualActivo: true, ajusteAnualPorcentaje: 15, pagosCliente: [{ id: 'p', estadoPago: 'confirmado', monto: 100000, fecha: '2026-10-06' }] } as any;

  it.each([
    ['evento 2026, sin ajuste', { eventoFecha: '2026-12-01' }],
    ['evento 2027, un ajuste', { eventoFecha: '2027-08-08' }],
    ['evento 2028, dos ajustes', { eventoFecha: '2028-08-08' }],
    ['ajuste apagado', { eventoFecha: '2027-08-08', ajusteAnualActivo: false }],
  ])('%s', (_n, extra) => {
    const p = { ...base, ...extra };
    const resumen = getBudgetPaymentSummary(p, { includeAnnualAdjustment: true });
    const libro = calculateFinancialLedger([p], []);
    expect(libro.saldoPendiente).toBe(resumen.balance);
  });

  it('con ajuste, el libro muestra los $15.000 por cobrar', () => {
    expect(calculateFinancialLedger([{ ...base, eventoFecha: '2027-08-08' }], []).saldoPendiente).toBe(15000);
  });
});
