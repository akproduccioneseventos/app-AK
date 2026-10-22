/**
 * Orden 210 (Codex 188-201, portal del cliente), lo de plata que arregló Claude:
 * A1  dos toques de "informé un pago" a la vez dejaban dos avisos del mismo pago;
 * A2  el comprobante que no se subía quedaba perdido, y el reintento no lo volvía a subir;
 * A5  la segunda cancelación anunciaba devolución con deuda (olvidaba la multa anterior);
 * A6  la cancelación total con descuento fijo descontaba dos veces;
 * A9  dos pedidos del cliente a la vez: los dos "guardados", quedaba uno;
 * y, en el barrido de la misma forma: aprobar dos veces a la vez sumaba dos veces el extra al
 * presupuesto, y rechazar un pedido pedía sólo sesión.
 * La base de mentira devuelve COPIAS y atiende de a una transacción (error 11).
 */
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((r) => setTimeout(r, 5));

let presupuestos: any[];
let fiesta: any;
const subir = jest.fn(async (..._a: any[]) => undefined);
const permisoAlguno = jest.fn(async (..._a: any[]) => undefined);

jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => true), setPortalSessionCookie: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(),
  requirePermiso: jest.fn(async () => ({ ok: true, user: {} })),
  requirePermisoAlguno: (...a: any[]) => permisoAlguno(...a),
}));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: jest.fn(async () => []) }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ getFiestaByIdRaw: jest.fn() }));
let turnoFiesta: Promise<unknown> = Promise.resolve();
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn((_id: string, cambiar: (f: any) => any) => {
    const r = turnoFiesta.then(async () => {
      const nueva = await cambiar(copia(fiesta));
      await esperar();
      fiesta = copia(nueva);
      return { success: true, updatedFiesta: copia(nueva) };
    });
    turnoFiesta = r.catch(() => undefined);
    return r;
  }),
}));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => undefined) }));
jest.mock('@/app/actions/google-workspace-extended', () => ({
  notifyClientPaymentApproved: jest.fn(), notifyClientPaymentRejected: jest.fn(), notifyClientPaymentSubmitted: jest.fn(async () => undefined),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: (...a: any[]) => subir(...a) }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/app/actions/presupuestos', () => ({ addPagoToPresupuesto: jest.fn(async () => ({ success: true })), getPresupuestoById: jest.fn() }));
jest.mock('fs/promises', () => ({ mkdir: jest.fn(async () => undefined), writeFile: jest.fn(async () => undefined) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => copia(fiesta)),
  getFiestas: jest.fn(async () => []),
  saveFiesta: jest.fn(async (f: any) => { await esperar(); fiesta = copia(f); return { success: true }; }),
}));
let turno: Promise<unknown> = Promise.resolve();
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => copia(presupuestos)),
  writeData: jest.fn(async (_f: string, lista: any[]) => { presupuestos = copia(lista); }),
  mutateDataItem: jest.fn((_f: string, _c: string, id: string, cambiar: (a: any) => any) => {
    const r = turno.then(async () => {
      const actual = presupuestos.find((p) => p.id === id);
      if (!actual) return null;
      const nuevo = cambiar(copia(actual));
      await esperar();
      if (!nuevo) return null;
      presupuestos = presupuestos.map((p) => (p.id === id ? copia(nuevo) : p));
      return copia(nuevo);
    });
    turno = r.catch(() => undefined);
    return r;
  }),
}));

import {
  submitClientPayment, cancelServicesOrParty, submitClientMenuChangeRequest, submitClientServiceAddRequest,
  approveClientServiceChangeRequest, rejectClientServiceChangeRequest,
} from '@/app/actions/fiesta/portal.actions';
import { totalTrasCancelar } from '@/lib/budget/total-tras-cancelar';

const item = (id: string, costo: number) => ({
  idServicioCatalogo: id, nombreServicio: id, cantidad: 1, precioUnitario: costo, precioUnitarioPresupuesto: costo, costoTotalItem: costo, categoriaServicio: 'X',
});

beforeEach(() => {
  subir.mockReset();
  permisoAlguno.mockClear();
  fiesta = {
    id: 'f1', presupuestoId: 'p1', configuracion: { nombreEvento: 'Quince de Ana', fechaEvento: '2026-12-10', invitadosEstimados: 100 },
    clientPortalSettings: { clientPassword: '1234' }, clientPaymentNotifications: [],
    clientMenuChangeRequests: [], clientServiceChangeRequests: [],
  };
  presupuestos = [{
    id: 'p1', estado: 'Aceptado', clienteNombre: 'Ana', eventoFecha: '2026-12-10',
    itemsPresupuestados: [item('dj', 700), item('foto', 300)],
    costoTotalEstimado: 1000, totalConDescuento: 1000, saldo: 900, ajusteAnualPorcentaje: 0,
    pagosCliente: [
      { id: 'pg1', monto: 100, estadoPago: 'confirmado', fecha: '2026-10-01' },
      { id: 'pg2', monto: 200, estadoPago: 'pendiente_confirmacion', fecha: '2026-10-02' },
      { id: 'pg3', monto: 50, estadoPago: 'rechazado', fecha: '2026-10-03' },
    ],
  }];
});

describe('el portal del cliente no pierde ni inventa plata (orden 210)', () => {
  it('A1: dos toques a la vez del mismo pago dejan UN aviso; montos distintos, dos', async () => {
    const [a, b] = await Promise.all([submitClientPayment('f1', 500), submitClientPayment('f1', 500)]);
    expect(a.success && b.success).toBe(true);
    expect(fiesta.clientPaymentNotifications).toHaveLength(1);
    expect(a.notificationId).toBe(b.notificationId);
    await Promise.all([submitClientPayment('f1', 250), submitClientPayment('f1', 300)]);
    expect(fiesta.clientPaymentNotifications).toHaveLength(3);
  });

  it('A2: si el comprobante no sube, se avisa; el reintento lo sube y queda en el MISMO aviso', async () => {
    const archivo = 'data:image/png;base64,aGVsbG8=';
    subir.mockRejectedValueOnce(new Error('Storage caído'));
    const primero = await submitClientPayment('f1', 400, archivo, 'transferencia.png');
    expect(primero.success).toBe(true);
    expect(primero.aviso).toMatch(/no se pudo subir/);
    expect(fiesta.clientPaymentNotifications[0].comprobanteUrl).toBeUndefined();

    const segundo = await submitClientPayment('f1', 400, archivo, 'transferencia.png');
    expect(subir).toHaveBeenCalledTimes(2);
    expect(segundo.notificationId).toBe(primero.notificationId);
    expect(fiesta.clientPaymentNotifications).toHaveLength(1);
    expect(fiesta.clientPaymentNotifications[0].comprobanteUrl).toMatch(/^payments\/f1\//);
  });

  it('A5: la segunda cancelación cuenta la multa anterior: queda deuda, no devolución', async () => {
    const r1 = await cancelServicesOrParty('f1', { servicesToCancel: ['dj'], cancelAll: false, passwordInput: '1234' });
    expect(r1.success).toBe(true);
    const r2 = await cancelServicesOrParty('f1', { servicesToCancel: ['foto'], cancelAll: false, passwordInput: '1234' });
    expect(r2.success).toBe(true);
    expect(presupuestos[0].totalConDescuento).toBe(300);
    expect(r2.pendingDue).toBe(200);
    expect(r2.refundAmount).toBe(0);
  });

  it('A6: cancelación total con descuento fijo: lo guardado y lo anunciado dan lo mismo', async () => {
    presupuestos[0] = { ...presupuestos[0], itemsPresupuestados: [item('dj', 1000)], costoTotalEstimado: 1000, totalConDescuento: 900, descuentoTipo: 'fijo', descuentoValor: 100 };
    const r = await cancelServicesOrParty('f1', { servicesToCancel: [], cancelAll: true, passwordInput: '1234' });
    expect(r.success).toBe(true);
    expect(presupuestos[0].totalConDescuento).toBe(270);
    expect(r.pendingDue).toBe(170);
  });

  it('la cuenta única: servicios con su descuento, multas enteras', () => {
    expect(totalTrasCancelar([item('multa_cancelacion_1', 210), item('multa_cancelacion_2', 90)], 'fijo', 100)).toBe(300);
    expect(totalTrasCancelar([item('foto', 300), item('multa_cancelacion_1', 210)], 'porcentaje', 10)).toBe(480);
  });

  it('A9: dos pedidos distintos a la vez quedan los dos', async () => {
    const [a, b] = await Promise.all([
      submitClientMenuChangeRequest('f1', { adultosDelta: 1, ninosAdolescentesDelta: 0, montoAdicional: 80, nuevoTotalEstimado: 1080 }),
      submitClientServiceAddRequest('f1', { servicioId: 's1', nombreServicio: 'Cabina', cantidad: 1, precioBase: 200, ajustePorcentaje: 0, montoAdicional: 200, nuevoTotalEstimado: 1200 }),
    ]);
    const [c] = await Promise.all([
      submitClientMenuChangeRequest('f1', { adultosDelta: 2, ninosAdolescentesDelta: 0, montoAdicional: 160, nuevoTotalEstimado: 1160 }),
    ]);
    expect(a.success && b.success && c.success).toBe(true);
    expect(fiesta.clientMenuChangeRequests).toHaveLength(2);
    expect(fiesta.clientServiceChangeRequests).toHaveLength(1);
  });

  it('aprobar dos veces a la vez el mismo extra lo suma UNA vez; rechazar pide permiso', async () => {
    await submitClientServiceAddRequest('f1', { servicioId: 's1', nombreServicio: 'Cabina', cantidad: 1, precioBase: 200, ajustePorcentaje: 0, montoAdicional: 200, nuevoTotalEstimado: 1200 });
    const id = fiesta.clientServiceChangeRequests[0].id;
    const [a, b] = await Promise.all([approveClientServiceChangeRequest('f1', id), approveClientServiceChangeRequest('f1', id)]);
    expect([a.success, b.success].sort()).toEqual([false, true]);
    expect(presupuestos[0].totalConDescuento).toBe(1200);
    expect(presupuestos[0].itemsPresupuestados).toHaveLength(3);

    permisoAlguno.mockClear();
    await submitClientServiceAddRequest('f1', { servicioId: 's2', nombreServicio: 'Glitter', cantidad: 1, precioBase: 50, ajustePorcentaje: 0, montoAdicional: 50, nuevoTotalEstimado: 1250 });
    await rejectClientServiceChangeRequest('f1', fiesta.clientServiceChangeRequests[1].id);
    expect(permisoAlguno).toHaveBeenCalled();
  });
});
