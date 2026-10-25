/**
 * MATAFUEGO — Codex 263 (orden 218), 23/10/2026: un intento A de aprobar un aviso de pago falla en el
 * presupuesto (supera el saldo); mientras su respuesta tarda, B reintenta el MISMO aviso y lo acredita.
 * La respuesta tardía de A volvía el aviso a "pendiente" con la plata ya acreditada.
 *
 * Ahora quien acredita deja la marca en el aviso (cobroConfirmadoAt) adentro de la escritura de la
 * fiesta, y la vuelta atrás de un fallo no toca un aviso marcado. Si la vuelta atrás llegó primero,
 * la marca lo vuelve a aprobado. El mail al cliente sale una vez.
 * La base de mentira devuelve COPIAS y atiende de a una (error 11). Se probó rompiéndolo: sacando la
 * condición de la marca en la vuelta atrás, el primer caso se pone en rojo.
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

import { approveClientPayment } from '@/app/actions/fiesta/portal.actions';

const cobrar = () => jest.requireMock('@/app/actions/presupuestos').addPagoToPresupuesto as jest.Mock;
const mail = () => jest.requireMock('@/app/actions/google-workspace-extended').notifyClientPaymentApproved as jest.Mock;
const retenido = () => {
  let soltar!: (r: any) => void;
  const p = new Promise<any>((res) => { soltar = res; });
  return { p, soltar };
};
const hasta = async (cond: () => boolean) => { for (let i = 0; i < 200 && !cond(); i++) await esperar(); };

beforeEach(() => {
  fiesta = { id: 'f1', presupuestoId: 'p1', configuracion: {}, clientPaymentNotifications: [{ id: 'n1', monto: 1000, estado: 'pendiente', timestamp: '2026-10-22' }] };
  presupuestos = [];
  cobrar().mockReset();
  mail().mockClear();
});

describe('un fallo tardío no devuelve a pendiente un aviso que otro intento ya acreditó (orden 218)', () => {
  it('B acredita mientras A espera su rechazo: el aviso queda aprobado y con un solo mail', async () => {
    const a = retenido();
    cobrar().mockImplementationOnce(() => a.p).mockImplementationOnce(async () => ({ success: true }));
    const intentoA = approveClientPayment('f1', 'n1');
    await hasta(() => cobrar().mock.calls.length === 1);
    const b = await approveClientPayment('f1', 'n1');
    expect(b.success).toBe(true);
    a.soltar({ success: false, error: 'Supera el saldo' });
    expect((await intentoA).success).toBe(false);
    const n = fiesta.clientPaymentNotifications[0];
    expect(n.estado).toBe('aprobado');
    expect(n.cobroConfirmadoAt).toBeTruthy();
    expect(mail()).toHaveBeenCalledTimes(1);
  });

  it('si la vuelta atrás de A llega antes que la marca de B, la marca lo deja aprobado', async () => {
    const a = retenido();
    const b = retenido();
    cobrar().mockImplementationOnce(() => a.p).mockImplementationOnce(() => b.p);
    const intentoA = approveClientPayment('f1', 'n1');
    await hasta(() => cobrar().mock.calls.length === 1);
    const intentoB = approveClientPayment('f1', 'n1');
    await hasta(() => cobrar().mock.calls.length === 2);
    a.soltar({ success: false, error: 'Supera el saldo' });
    await intentoA;
    expect(fiesta.clientPaymentNotifications[0].estado).toBe('pendiente');
    b.soltar({ success: true });
    expect((await intentoB).success).toBe(true);
    expect(fiesta.clientPaymentNotifications[0].estado).toBe('aprobado');
    expect(fiesta.clientPaymentNotifications[0].cobroConfirmadoAt).toBeTruthy();
    expect(mail()).toHaveBeenCalledTimes(1);
  });

  it('control: si ningún intento lo acreditó, el aviso vuelve a pendiente y no sale mail', async () => {
    cobrar().mockImplementation(async () => ({ success: false, error: 'Supera el saldo' }));
    expect((await approveClientPayment('f1', 'n1')).success).toBe(false);
    expect(fiesta.clientPaymentNotifications[0].estado).toBe('pendiente');
    expect(fiesta.clientPaymentNotifications[0].cobroConfirmadoAt).toBeUndefined();
    expect(mail()).not.toHaveBeenCalled();
  });

  it('un reintento después de acreditado no cobra de nuevo la marca ni manda otro mail', async () => {
    cobrar().mockImplementation(async () => ({ success: true }));
    expect((await approveClientPayment('f1', 'n1')).success).toBe(true);
    const marca = fiesta.clientPaymentNotifications[0].cobroConfirmadoAt;
    expect((await approveClientPayment('f1', 'n1')).success).toBe(true);
    expect(fiesta.clientPaymentNotifications[0].cobroConfirmadoAt).toBe(marca);
    expect(mail()).toHaveBeenCalledTimes(1);
  });
});

describe('barrido de la pregunta 93: deshacer una cancelación no borra un cobro que entró en el medio', () => {
  it('si la fiesta no se guarda, la multa se saca pero el saldo conserva el cobro de otro', async () => {
    const { cancelServicesOrParty } = await import('@/app/actions/fiesta/portal.actions');
    const item = (id: string, costo: number) => ({
      idServicioCatalogo: id, nombreServicio: id, cantidad: 1, precioUnitario: costo, precioUnitarioPresupuesto: costo, costoTotalItem: costo, categoriaServicio: 'X',
    });
    fiesta = { ...fiesta, configuracion: { nombreEvento: 'Quince de Ana', fechaEvento: '2026-12-10' }, clientPortalSettings: { clientPassword: '1234' } };
    presupuestos = [{
      id: 'p1', estado: 'Aceptado', clienteNombre: 'Ana', eventoFecha: '2026-12-10',
      itemsPresupuestados: [item('dj', 700), item('foto', 300)],
      costoTotalEstimado: 1000, totalConDescuento: 1000, saldo: 900, ajusteAnualPorcentaje: 0,
      pagosCliente: [{ id: 'pg1', monto: 100, estadoPago: 'confirmado', fecha: '2026-10-01' }],
    }];
    const guardar = jest.requireMock('@/app/actions/fiesta/fiesta.actions').saveFiesta as jest.Mock;
    guardar.mockImplementationOnce(async () => {
      // Entra un cobro de 200 mientras se guarda la fiesta.
      presupuestos = presupuestos.map((p) => ({ ...p, saldo: p.saldo - 200, pagosCliente: [...p.pagosCliente, { id: 'pg2', monto: 200, estadoPago: 'confirmado', fecha: '2026-10-23' }] }));
      return { success: false, error: 'La base no contesta' };
    });
    const r = await cancelServicesOrParty('f1', { servicesToCancel: ['dj'], cancelAll: false, passwordInput: '1234' });
    expect(r.success).toBe(false);
    expect(presupuestos[0].saldo).toBe(700);
    expect(presupuestos[0].totalConDescuento).toBe(1000);
    expect(presupuestos[0].pagosCliente).toHaveLength(2);
  });
});
