/** @jest-environment node */
/**
 * PAGO A PROVEEDOR: un reintento no lo anota dos veces (pregunta 58, 14 de octubre de 2026).
 *
 * Pantalla /fiestas/nueva/gestion-costos-rentabilidad. Antes mandaba la lista entera armada en el
 * navegador; ahora `agregarPagoProveedor` agrega SOLO este pago sobre la lista guardada de ese
 * momento, con la identidad del intento. La base simulada devuelve copias y aplica cada cambio
 * en su turno, como la de verdad.
 */
let fiesta: any;
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
let permitido = true;

jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => ({})) }));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => {
    if (!permitido) throw new Error('No tenés permiso de contabilidad.');
    return {};
  }),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, cambiar: (f: any) => any) => {
    fiesta = copia(cambiar(copia(fiesta)));
    return { success: true };
  }),
}));

import { agregarPagoProveedor } from '@/app/actions/fiesta/pagos.actions';

const pago = (id: string, monto = 1500) => ({ id, costoAsociadoId: 'costo_dj', fecha: '2026-10-14T12:00:00.000Z', monto });

beforeEach(() => {
  permitido = true;
  fiesta = { id: 'f1', pagosProveedores: [pago('pago_viejo_0001', 200)] };
});

it('la respuesta se perdió y se reintenta con la misma identidad: queda UN pago', async () => {
  const a = await agregarPagoProveedor('f1', pago('pago_intento_0001'));
  const b = await agregarPagoProveedor('f1', pago('pago_intento_0001'));
  expect(a.success).toBe(true);
  expect(b).toEqual({ success: true, yaEstaba: true });
  expect(fiesta.pagosProveedores.map((p: any) => p.id)).toEqual(['pago_viejo_0001', 'pago_intento_0001']);
});

it('otro pago (otra identidad) se agrega y no pisa los que ya estaban', async () => {
  await agregarPagoProveedor('f1', pago('pago_intento_0001'));
  await agregarPagoProveedor('f1', pago('pago_intento_0002', 900));
  expect(fiesta.pagosProveedores.map((p: any) => p.monto)).toEqual([200, 1500, 900]);
});

it('sin permiso de contabilidad, o con identidad o importe inválidos, no se anota nada', async () => {
  permitido = false;
  expect((await agregarPagoProveedor('f1', pago('pago_intento_0001'))).success).toBe(false);
  permitido = true;
  expect((await agregarPagoProveedor('f1', pago('../x'))).success).toBe(false);
  expect((await agregarPagoProveedor('f1', pago('pago_intento_0003', -5))).success).toBe(false);
  expect(fiesta.pagosProveedores).toHaveLength(1);
});
