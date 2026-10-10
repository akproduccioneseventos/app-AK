/** @jest-environment node */
/**
 * La pantalla /empresa/contabilidad/poner-al-dia (pedido del dueño, 9/10/2026) aplica lo que una
 * persona marca. Es plata:
 *
 * - Sin permiso de contabilidad no lee ni aplica nada.
 * - La lista se vuelve a armar en el servidor: un id que la pantalla mande y no esté en la lista
 *   de ahora se ignora, y el cobro se anota por el saldo de ahora, no por uno viejo.
 * - Si un paso falla, la respuesta lo dice y no anuncia "todo listo".
 *
 * Probado rompiéndolo: sin el filtro por la lista del servidor, o con la guardia sacada, se pone en rojo.
 */
let permitido = true;
jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => (permitido ? { ok: true } : { ok: false, error: 'No autorizado' })),
}));
const presupuestos: any[] = [];
jest.mock('@/lib/data-service', () => ({
  readDataConDetalle: jest.fn(async () => ({ valor: JSON.parse(JSON.stringify(presupuestos)), huboFalla: false })),
}));
const fiestas: any[] = [];
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: jest.fn(async () => JSON.parse(JSON.stringify(fiestas))) }));
jest.mock('@/lib/utils', () => ({ hoyEnUruguay: () => '2026-10-09' }));
const addPago = jest.fn(async (..._a: any[]) => ({ success: true }));
const archivarPresupuesto = jest.fn(async (..._a: any[]) => ({ success: true }));
jest.mock('@/app/actions/presupuestos', () => ({
  addPagoToPresupuesto: (...a: any[]) => addPago(...a),
  archivePresupuesto: (...a: any[]) => archivarPresupuesto(...a),
}));
const suspender = jest.fn(async (..._a: any[]) => ({ success: true }));
const archivarFiesta = jest.fn(async (..._a: any[]) => ({ success: true }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  suspenderFiestaAction: (...a: any[]) => suspender(...a),
  archiveFiesta: (...a: any[]) => archivarFiesta(...a),
}));

import { aplicarPonerAlDia, getPonerAlDia } from '@/app/actions/poner-al-dia';

const vacio = { cobrar: [], cancelar: [], archivarCopias: [], archivarPruebas: [] };

beforeEach(() => {
  permitido = true;
  presupuestos.length = 0;
  fiestas.length = 0;
  presupuestos.push({
    id: 'p1', clienteNombre: 'Claudia Flores', eventoFecha: '2026-08-08T00:00:00.000Z', estado: 'Aceptado',
    totalConDescuento: 200_000, costoTotalEstimado: 200_000, itemsPresupuestados: [],
    pagosCliente: [{ id: 'x', monto: 50_000, estadoPago: 'confirmado' }],
  });
  fiestas.push({ id: 'f1', presupuestoId: 'p1', estado: 'En Planificación', configuracion: { nombreEvento: 'Evento de Claudia', fechaEvento: '2026-08-08' } });
  for (const m of [addPago, archivarPresupuesto, suspender, archivarFiesta]) m.mockClear();
});

it('sin permiso de contabilidad no lee ni aplica nada', async () => {
  permitido = false;
  expect((await getPonerAlDia()).success).toBe(false);
  const r = await aplicarPonerAlDia({ ...vacio, cobrar: ['p1'] });
  expect(r.success).toBe(false);
  expect(addPago).not.toHaveBeenCalled();
});

it('anota el cobro por el saldo de ahora y con referencia que no se duplica', async () => {
  const r = await aplicarPonerAlDia({ ...vacio, cobrar: ['p1'] });
  expect(r).toMatchObject({ success: true, hechos: 1 });
  expect(addPago).toHaveBeenCalledTimes(1);
  expect(addPago.mock.calls[0][0]).toBe('p1');
  expect(addPago.mock.calls[0][1]).toMatchObject({ monto: 150_000, estadoPago: 'confirmado', referencia: 'AK_SYNC:poner-al-dia:p1' });
});

it('ignora lo que la pantalla manda y ya no está en la lista', async () => {
  const r = await aplicarPonerAlDia({ cobrar: ['otro'], cancelar: ['inventada'], archivarCopias: ['f1'], archivarPruebas: ['p1'] });
  expect(r.hechos).toBe(0);
  expect(addPago).not.toHaveBeenCalled();
  expect(suspender).not.toHaveBeenCalled();
  expect(archivarFiesta).not.toHaveBeenCalled();
  expect(archivarPresupuesto).not.toHaveBeenCalled();
});

it('si el cobro no se guarda, la respuesta lo dice', async () => {
  addPago.mockResolvedValueOnce({ success: false, error: 'base caída' } as any);
  const r = await aplicarPonerAlDia({ ...vacio, cobrar: ['p1'] });
  expect(r.success).toBe(false);
  expect(r.hechos).toBe(0);
  expect(r.fallas[0].error).toBe('base caída');
});
