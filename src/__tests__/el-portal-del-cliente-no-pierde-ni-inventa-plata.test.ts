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
  notifyClientPaymentApproved: jest.fn(async () => undefined), notifyClientPaymentRejected: jest.fn(async () => undefined), notifyClientPaymentSubmitted: jest.fn(async () => undefined),
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
  approveClientServiceChangeRequest, rejectClientServiceChangeRequest, approveClientMenuChangeRequest,
  approveClientPayment, rejectClientPayment,
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

describe('aprobar pedidos del cliente cambia el presupuesto de verdad (Codex 204, orden 211)', () => {
  const pedirServicio = (cantidad: number, precioBase: number) => submitClientServiceAddRequest('f1', {
    servicioId: 's1', nombreServicio: 'Cabina', cantidad, precioBase, ajustePorcentaje: 0, montoAdicional: precioBase, nuevoTotalEstimado: 1000 + precioBase,
  });

  it('B1: con el contrato firmado no se aprueba ni se toca el presupuesto', async () => {
    fiesta.contratoFirmaInfo = { isSigned: true };
    await pedirServicio(1, 200);
    const r = await approveClientServiceChangeRequest('f1', fiesta.clientServiceChangeRequests[0].id);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/adenda/);
    expect(fiesta.clientServiceChangeRequests[0].status).toBe('pendiente');
    expect(presupuestos[0].itemsPresupuestados).toHaveLength(2);
  });

  it('B1/B4: si el presupuesto no se puede guardar, el pedido vuelve a pendiente; el reintento lo suma una vez', async () => {
    await pedirServicio(1, 200);
    const id = fiesta.clientServiceChangeRequests[0].id;
    const { mutateDataItem } = jest.requireMock('@/lib/data-service');
    (mutateDataItem as jest.Mock).mockImplementationOnce(async () => { throw new Error('La base no contesta'); });
    const fallo = await approveClientServiceChangeRequest('f1', id);
    expect(fallo.success).toBe(false);
    expect(fiesta.clientServiceChangeRequests[0].status).toBe('pendiente');
    expect(presupuestos[0].itemsPresupuestados).toHaveLength(2);

    expect((await approveClientServiceChangeRequest('f1', id)).success).toBe(true);
    expect(presupuestos[0].itemsPresupuestados).toHaveLength(3);
    expect(presupuestos[0].totalConDescuento).toBe(1200);
  });

  it('B3: dos unidades de un extra suman su total una vez, no el doble', async () => {
    await pedirServicio(2, 400);
    await approveClientServiceChangeRequest('f1', fiesta.clientServiceChangeRequests[0].id);
    expect(presupuestos[0].totalConDescuento).toBe(1400);
    const renglon = presupuestos[0].itemsPresupuestados[2];
    expect(renglon.precioUnitario).toBe(200);
    expect(renglon.costoTotalItem).toBe(400);
  });

  it('B2: más adultos aprobados llegan al desglose del presupuesto, y el precio por persona se recalcula', async () => {
    presupuestos[0] = {
      ...presupuestos[0], invitadosAdultos: 25, invitadosNinos: 0, invitadosAdolescentes: 0, invitadosCantidad: 25,
      itemsPresupuestados: [{ ...item('menu', 1000), calculationMethod: 'porPersona', precioUnitario: 40, precioUnitarioPresupuesto: 40 }],
      costoTotalEstimado: 1000, totalConDescuento: 1000,
    };
    await submitClientMenuChangeRequest('f1', { adultosDelta: 2, ninosAdolescentesDelta: 0, montoAdicional: 80, nuevoTotalEstimado: 1080 });
    const r = await approveClientMenuChangeRequest('f1', fiesta.clientMenuChangeRequests[0].id);
    expect(r.success).toBe(true);
    expect(presupuestos[0].invitadosAdultos).toBe(27);
    expect(presupuestos[0].totalConDescuento).toBe(1080);
    expect(fiesta.configuracion.invitadosEstimados).toBe(102);
  });
});

describe('aprobar mientras pasa otra cosa (Codex 217-218, orden 213-claude)', () => {
  const pedirMenu = (adultosDelta: number) =>
    submitClientMenuChangeRequest('f1', { adultosDelta, ninosAdolescentesDelta: 0, montoAdicional: 40 * adultosDelta, nuevoTotalEstimado: 1000 });

  it('si el contrato se firma entre la primera lectura y la aprobación, no se aprueba ni se toca el presupuesto', async () => {
    await pedirMenu(2);
    const id = fiesta.clientMenuChangeRequests[0].id;
    const { getFiestaById } = jest.requireMock('@/app/actions/fiesta/fiesta.actions');
    (getFiestaById as jest.Mock).mockImplementationOnce(async () => {
      const vista = copia(fiesta); // todavía sin firma
      fiesta.contratoFirmaInfo = { isSigned: true }; // se firma justo después
      return vista;
    });
    const r = await approveClientMenuChangeRequest('f1', id);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/adenda/);
    expect(fiesta.clientMenuChangeRequests[0].status).toBe('pendiente');
    expect(fiesta.configuracion.invitadosEstimados).toBe(100);
    expect(presupuestos[0].totalConDescuento).toBe(1000);
  });

  it('si el contrato se firma DESPUÉS de aprobar, la aprobación ya hecha queda', async () => {
    await pedirMenu(2);
    expect((await approveClientMenuChangeRequest('f1', fiesta.clientMenuChangeRequests[0].id)).success).toBe(true);
    fiesta.contratoFirmaInfo = { isSigned: true };
    expect(fiesta.clientMenuChangeRequests[0].status).toBe('aprobada');
    expect(fiesta.configuracion.invitadosEstimados).toBe(102);
  });

  it('A falla y deshace lo suyo DESPUÉS de que B aprobó: quedan los invitados de B', async () => {
    await pedirMenu(2);
    await pedirMenu(3);
    const [a, b] = fiesta.clientMenuChangeRequests.map((r: any) => r.id);
    const { mutateDataItem } = jest.requireMock('@/lib/data-service');
    let soltarA!: () => void;
    const pausa = new Promise<void>((r) => { soltarA = r; });
    (mutateDataItem as jest.Mock).mockImplementationOnce(async () => { await pausa; throw new Error('La base no contesta'); });
    const aprobandoA = approveClientMenuChangeRequest('f1', a);
    await esperar(); await esperar();
    expect((await approveClientMenuChangeRequest('f1', b)).success).toBe(true);
    soltarA();
    expect((await aprobandoA).success).toBe(false);
    const estado = Object.fromEntries(fiesta.clientMenuChangeRequests.map((r: any) => [r.id, r.status]));
    expect(estado[a]).toBe('pendiente');
    expect(estado[b]).toBe('aprobada');
    expect(fiesta.configuracion.invitadosEstimados).toBe(103);
  });

  it('A falla sola: la fiesta vuelve a como estaba', async () => {
    await pedirMenu(2);
    const { mutateDataItem } = jest.requireMock('@/lib/data-service');
    (mutateDataItem as jest.Mock).mockImplementationOnce(async () => { throw new Error('La base no contesta'); });
    expect((await approveClientMenuChangeRequest('f1', fiesta.clientMenuChangeRequests[0].id)).success).toBe(false);
    expect(fiesta.configuracion.invitadosEstimados).toBe(100);
    expect(fiesta.clientMenuChangeRequests[0].status).toBe('pendiente');
  });
});

describe('aprobar y rechazar un aviso de pago a la vez (revisión contable 22/10)', () => {
  const aviso = () => ({ id: 'n1', monto: 5000, estado: 'pendiente', fecha: '2026-10-20' });
  const cobrar = () => jest.requireMock('@/app/actions/presupuestos').addPagoToPresupuesto as jest.Mock;
  beforeEach(() => { fiesta.clientPaymentNotifications = [aviso()]; cobrar().mockClear(); cobrar().mockImplementation(async () => ({ success: true })); });

  it('si otro lo rechazó antes, aprobar no cobra nada', async () => {
    const [r, a] = await Promise.all([rejectClientPayment('f1', 'n1'), approveClientPayment('f1', 'n1')]);
    expect(r.success).toBe(true);
    expect(a.success).toBe(false);
    expect(cobrar()).not.toHaveBeenCalled();
    expect(fiesta.clientPaymentNotifications[0].estado).toBe('rechazado');
  });

  it('si se aprobó primero, rechazar no lo vuelve a "rechazado" y el cobro queda una vez', async () => {
    const a = await approveClientPayment('f1', 'n1');
    const r = await rejectClientPayment('f1', 'n1');
    expect(a.success).toBe(true);
    expect(r.success).toBe(false);
    expect(cobrar()).toHaveBeenCalledTimes(1);
    expect(fiesta.clientPaymentNotifications[0].estado).toBe('aprobado');
  });

  it('si el presupuesto no toma el cobro, el aviso vuelve a pendiente', async () => {
    cobrar().mockImplementation(async () => ({ success: false, error: 'Supera el saldo' }));
    const a = await approveClientPayment('f1', 'n1');
    expect(a.success).toBe(false);
    expect(fiesta.clientPaymentNotifications[0].estado).toBe('pendiente');
  });
});
