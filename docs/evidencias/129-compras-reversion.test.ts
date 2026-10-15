/** @jest-environment node */
import fs from 'fs';

let mockFiesta: any;
const copy = (value: any) => JSON.parse(JSON.stringify(value));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => ({ role: 'admin' })) }));
jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn(async () => ({})) }));
jest.mock('@/lib/data-service', () => ({ readData: jest.fn(async () => []), writeData: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => copy(mockFiesta)),
  saveFiesta: jest.fn(), updateFiestaPartial: jest.fn(),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, change: (value: any) => any) => {
    mockFiesta = copy(await change(copy(mockFiesta)));
    return { success: true };
  }),
}));
import { updateShoppingListStatus } from '@/app/actions/fiesta/catering.actions';

const pedido = { proveedor: 'Proveedor QA129', proveedorId: 'qa129-prov', pedido: true, pagado: false };
const pendientes = () => mockFiesta.tareas.filter((t: any) => t.texto === 'Pagar insumos a: Proveedor QA129' && !t.completada);
beforeEach(() => {
  jest.clearAllMocks();
  mockFiesta = { id: 'qa129-compras', configuracion: { nombreEvento: 'Fiesta ficticia QA129' }, estadosCompra: [], tareas: [
    { id: 'otra', texto: 'Confirmar horario', completada: false },
  ] };
});

test('control: pedido abre recordatorio, pagado lo cierra y conserva otra tarea', async () => {
  expect(await updateShoppingListStatus(mockFiesta.id, [pedido], [])).toEqual({ success: true });
  expect(pendientes()).toHaveLength(1);
  const leidos = copy(mockFiesta.estadosCompra);
  expect(await updateShoppingListStatus(mockFiesta.id, [{ ...pedido, pagado: true }], leidos)).toEqual({ success: true });
  expect(pendientes()).toHaveLength(0);
  expect(mockFiesta.tareas.find((t: any) => t.id === 'otra').completada).toBe(false);
});

test('control: repetir la misma marca no crea otro recordatorio', async () => {
  await updateShoppingListStatus(mockFiesta.id, [pedido], []);
  await updateShoppingListStatus(mockFiesta.id, [pedido], []);
  expect(pendientes()).toHaveLength(1);
});

test('corregir Pagado total a pendiente vuelve a dejar visible el recordatorio de pago', async () => {
  await updateShoppingListStatus(mockFiesta.id, [pedido], []);
  await updateShoppingListStatus(mockFiesta.id, [{ ...pedido, pagado: true }], copy(mockFiesta.estadosCompra));
  const leidos = copy(mockFiesta.estadosCompra);
  const result = await updateShoppingListStatus(mockFiesta.id, [pedido], leidos);
  const observed = {
    applicationSourceSha: 'ce1ac07d1bb16c24dd73e2d26ac55038028a2472',
    scope: 'REAL_ACTION_WITH_IN_MEMORY_TRANSACTION_AND_AUTH_DOUBLES_NOT_NATIVE_BROWSER',
    sequence: ['pedido:true,pagado:false', 'pagado:true', 'pagado:false'],
    result, persisted: copy(mockFiesta), expectedPendingPaymentReminders: 1,
    observedPendingPaymentReminders: pendientes().length,
    realAccountsOrMoneyTouched: false,
  };
  fs.writeFileSync('docs/evidencias/129-compras-reversion-observado.json', JSON.stringify(observed, null, 2) + '\n');
  expect(result.success).toBe(true);
  expect(mockFiesta.estadosCompra[0].pagado).toBe(false);
  expect(pendientes()).toHaveLength(1);
});

test('control: un adelanto valido conserva sus centavos', async () => {
  mockFiesta.estadosCompra = [{ ...pedido, montoPagado: 0 }];
  const result = await updateShoppingListStatus(mockFiesta.id, [{ ...pedido, montoPagado: 125.50 }], copy(mockFiesta.estadosCompra));
  expect(result.success).toBe(true);
  expect(mockFiesta.estadosCompra[0].montoPagado).toBe(125.50);
});

test('el campo A Cuenta no acepta guardar un adelanto negativo', async () => {
  mockFiesta.estadosCompra = [{ ...pedido, montoPagado: 0 }];
  const result = await updateShoppingListStatus(mockFiesta.id, [{ ...pedido, montoPagado: -500 }], copy(mockFiesta.estadosCompra));
  fs.writeFileSync('docs/evidencias/129-compras-importe-observado.json', JSON.stringify({
    applicationSourceSha: 'ce1ac07d1bb16c24dd73e2d26ac55038028a2472',
    scope: 'REAL_ACTION_WITH_IN_MEMORY_TRANSACTION_AND_AUTH_DOUBLES_NOT_NATIVE_BROWSER',
    input: { montoPagado: -500 }, result, persisted: copy(mockFiesta.estadosCompra),
    expected: 'Rechazo claro sin guardar monto negativo; cero y centavos positivos siguen permitidos',
    realAccountsOrMoneyTouched: false,
  }, null, 2) + '\n');
  expect(result.success).toBe(false);
  expect(mockFiesta.estadosCompra[0].montoPagado).toBe(0);
});
