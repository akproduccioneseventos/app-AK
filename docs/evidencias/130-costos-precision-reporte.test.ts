/** @jest-environment node */
import fs from 'fs';
let mockGastos: any[] = [];
const copy = (x: any) => JSON.parse(JSON.stringify(x));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({})), requirePermisoAlguno: jest.fn(async () => ({})),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { perfil: 'dueno' } })),
}));
jest.mock('@/lib/auth/session-token', () => ({ verifySession: jest.fn(async () => ({ success: true, user: { role: 'admin' } })) }));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (file: string, fallback: any) => file === 'gastos-generales.json' ? copy(mockGastos) : fallback),
  writeData: jest.fn(async (file: string, data: any) => { if (file !== 'gastos-generales.json') throw new Error('Unexpected QA store'); mockGastos = copy(data); }),
  createDataItem: jest.fn(), deleteDataItem: jest.fn(),
}));
jest.mock('@/app/actions/invoices', () => ({ getInvoices: jest.fn(async () => []) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn(async () => []) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({ getAllFiestas: jest.fn(async () => []) }));
jest.mock('@/app/actions/roles', () => ({ getRoles: jest.fn(async () => []) }));
jest.mock('@/app/actions/settings', () => ({ getCompanyInfo: jest.fn(async () => ({})) }));
jest.mock('@/lib/contabilidad/mandar-resumen-al-contador', () => ({ mandarResumenAlContador: jest.fn() }));
import { saveGastoGeneral, getGastosGenerales } from '@/app/actions/gastos';
import { getProfitAndLossData } from '@/app/actions/reportes';
import { ALL_CATEGORIAS_GASTO } from '@/types/gastos';

const rows: any[] = [];
beforeEach(() => { jest.clearAllMocks(); mockGastos = []; });
afterAll(() => fs.writeFileSync('docs/evidencias/130-costos-precision-observado.json', JSON.stringify({
  applicationSourceSha: 'ce1ac07d1bb16c24dd73e2d26ac55038028a2472',
  scope: 'REAL_SAVE_EXPENSE_REAL_READ_EXPENSE_REAL_PROFIT_LOSS_WITH_IN_MEMORY_DATA_AUTH_DOUBLES_NOT_NATIVE_BROWSER',
  rows, realMoneyOrAccountsOrMessagesTouched: false,
}, null, 2) + '\n'));

test.each([
  ['control-enteros', [30, 30], 60],
  ['un-gasto-con-centavos', [60.30], 60.30],
  ['dos-gastos-con-centavos', [60.30, 60.30], 120.60],
] as Array<[string, number[], number]>)('%s: el reporte conserva lo que realmente se guardo', async (caso, montos, expected) => {
  expect(process.env.AK_USE_LOCAL_JSON_ONLY).toBe('true');
  const categoria = ALL_CATEGORIAS_GASTO.find(c => c !== 'Sueldos Administrativos')!;
  for (const [i, monto] of montos.entries()) {
    const result = await saveGastoGeneral({ concepto: `Gasto ficticio QA130 ${i}`, fecha: '2026-10-15', categoria, monto, idempotencyKey: `qa130-${caso}-${i}` });
    expect(result.success).toBe(true); expect(result.gasto?.monto).toBe(monto);
  }
  const persisted = await getGastosGenerales();
  expect(persisted).toHaveLength(montos.length);
  const realTotal = persisted.reduce((sum, gasto) => sum + gasto.monto, 0);
  const result = await getProfitAndLossData({ from: new Date('2026-01-01T00:00:00Z'), to: new Date('2026-12-31T23:59:59Z') });
  rows.push({ caso, expected, persisted, persistedTotal: realTotal, result });
  expect(result.success).toBe(true); expect(realTotal).toBeCloseTo(expected, 2);
  expect(result.data?.costos.total).toBeCloseTo(expected, 2);
  expect(result.data?.gananciaNeta).toBeCloseTo(-expected, 2);
});
