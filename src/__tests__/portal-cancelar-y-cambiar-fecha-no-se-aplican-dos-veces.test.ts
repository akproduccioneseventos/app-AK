/**
 * Cancelar servicios y cambiar la fecha desde el portal NO se aplican dos veces (12/10/2026).
 *
 * Antes: el doble toque calculaba la multa / el recargo del 10% dos veces sobre el mismo dato viejo
 * (o la segunda sobre el total ya ajustado), y si `saveFiesta` fallaba despues de guardar el
 * presupuesto, quedaba la multa cargada con la fiesta vieja. La base de mentira devuelve COPIAS
 * (error 11) y atiende de a una transaccion, como la de verdad.
 */
const copia = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const esperar = () => new Promise((r) => setTimeout(r, 10));

let presupuestos: any[];
let fiesta: any;
let guardarFiestaFalla = false;
let turno: Promise<unknown> = Promise.resolve();
const mail = jest.fn(async (..._a: any[]) => undefined);

jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => true), setPortalSessionCookie: jest.fn() }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(), requirePermiso: jest.fn(async () => ({ ok: true, user: {} })), requirePermisoAlguno: jest.fn() }));
jest.mock('@/lib/fiesta/leer-fiestas', () => ({ leerFiestasCrudas: jest.fn(async () => []) }));
jest.mock('@/lib/fiesta/get-fiesta-raw', () => ({ getFiestaByIdRaw: jest.fn() }));
// La transaccion de la fiesta: de a una por vez, sobre copias.
let turnoFiesta: Promise<unknown> = Promise.resolve();
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn((_id: string, cambiar: (f: any) => any) => {
    const r = turnoFiesta.then(async () => {
      try {
        const nueva = await cambiar(copia(fiesta));
        await esperar();
        fiesta = copia(nueva);
        return { success: true };
      } catch (e: any) { return { success: false, error: e.message }; }
    });
    turnoFiesta = r.catch(() => undefined);
    return r;
  }),
}));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => undefined) }));
jest.mock('@/app/actions/google-workspace-extended', () => ({
  notifyClientPaymentApproved: (...a: any[]) => mail(...a),
  notifyClientPaymentRejected: jest.fn(),
  notifyClientPaymentSubmitted: jest.fn(),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn() }));
jest.mock('@/lib/commercial/public-rate-limit', () => ({ enforcePublicRateLimit: jest.fn() }));
jest.mock('@/app/actions/presupuestos', () => ({ addPagoToPresupuesto: jest.fn(async () => ({ success: true })), getPresupuestoById: jest.fn(), updatePresupuesto: jest.fn() }));
jest.mock('fs/promises', () => ({ mkdir: jest.fn(async () => undefined), writeFile: jest.fn(async () => undefined) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => copia(fiesta)),
  getFiestas: jest.fn(async () => []),
  saveFiesta: jest.fn(async (f: any) => {
    await esperar();
    if (guardarFiestaFalla) return { success: false, error: 'La base no contesta.' };
    fiesta = copia(f);
    return { success: true };
  }),
}));
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => copia(presupuestos)),
  writeData: jest.fn(async (_f: string, lista: any[]) => { presupuestos = copia(lista); }),
  // La transaccion de la base: de a una por vez, sobre copias.
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

import { cancelServicesOrParty, changeEventDate, approveClientPayment } from '@/app/actions/fiesta/portal.actions';

const item = (id: string, costo: number) => ({
  idServicioCatalogo: id, nombreServicio: id, cantidad: 1, precioUnitario: costo, precioUnitarioPresupuesto: costo, costoTotalItem: costo, categoriaServicio: 'X',
});

beforeEach(() => {
  guardarFiestaFalla = false;
  mail.mockClear();
  presupuestos = [{
    id: 'p1', estado: 'Aceptado', clienteNombre: 'Ana', eventoFecha: '2026-12-10',
    itemsPresupuestados: [item('dj', 10000), item('foto', 5000)],
    costoTotalEstimado: 15000, totalConDescuento: 15000, saldo: 15000, pagosCliente: [],
    fechaFirmaContrato: new Date().toISOString(),
  }];
  fiesta = {
    id: 'f1', presupuestoId: 'p1', configuracion: { nombreEvento: 'Quince', fechaEvento: '2026-12-10' },
    clientPortalSettings: { clientPassword: '1234' }, othersDocumentos: [],
  };
});

const pin = '1234';

describe('cancelar desde el portal', () => {
  it('dos toques seguidos suman UNA sola multa', async () => {
    const [a, b] = await Promise.all([
      cancelServicesOrParty('f1', { servicesToCancel: ['dj'], cancelAll: false, passwordInput: pin }),
      cancelServicesOrParty('f1', { servicesToCancel: ['dj'], cancelAll: false, passwordInput: pin }),
    ]);
    expect(a.success && b.success).toBe(true);
    const multas = presupuestos[0].itemsPresupuestados;
    // queda 'foto' (5000) y UNA multa del 30% de 'dj' (3000; el ano de firma es el actual: x1).
    expect(multas.map((i: any) => String(i.idServicioCatalogo).replace(/\d+$/, ''))).toEqual(['foto', 'multa_cancelacion_']);
    expect(presupuestos[0].costoTotalEstimado).toBe(8000);
    expect([a, b].filter((r) => r.yaEstaba).length).toBe(1);
  });

  it('cancelar todo dos veces deja UNA multa del 30% y no recalcula sobre el total ya ajustado', async () => {
    const [a, b] = await Promise.all([
      cancelServicesOrParty('f1', { servicesToCancel: [], cancelAll: true, passwordInput: pin }),
      cancelServicesOrParty('f1', { servicesToCancel: [], cancelAll: true, passwordInput: pin }),
    ]);
    expect(a.success && b.success).toBe(true);
    expect(presupuestos[0].itemsPresupuestados).toHaveLength(1);
    expect(presupuestos[0].costoTotalEstimado).toBe(4500); // 30% de 15000, no 30% de 4500
    // tambien si se repite despues
    const c = await cancelServicesOrParty('f1', { servicesToCancel: [], cancelAll: true, passwordInput: pin });
    expect(c.yaEstaba).toBe(true);
    expect(presupuestos[0].costoTotalEstimado).toBe(4500);
  });

  it('si la fiesta no se guarda, el presupuesto vuelve a como estaba', async () => {
    const antes = copia(presupuestos[0]);
    guardarFiestaFalla = true;
    const r = await cancelServicesOrParty('f1', { servicesToCancel: ['dj'], cancelAll: false, passwordInput: pin });
    expect(r.success).toBe(false);
    expect(presupuestos[0].itemsPresupuestados).toEqual(antes.itemsPresupuestados);
    expect(presupuestos[0].costoTotalEstimado).toBe(antes.costoTotalEstimado);
    expect(presupuestos[0].ajustesAplicados ?? []).toEqual([]);
    // y se puede reintentar: ahora si cobra la multa, una vez
    guardarFiestaFalla = false;
    const r2 = await cancelServicesOrParty('f1', { servicesToCancel: ['dj'], cancelAll: false, passwordInput: pin });
    expect(r2.success).toBe(true);
    expect(presupuestos[0].itemsPresupuestados).toHaveLength(2);
    expect(presupuestos[0].costoTotalEstimado).toBe(8000);
  });
});

describe('cambiar la fecha desde el portal', () => {
  it('dos toques seguidos suman UN solo recargo del 10%', async () => {
    const [a, b] = await Promise.all([
      changeEventDate('f1', { newDate: '2027-01-15', passwordInput: pin }),
      changeEventDate('f1', { newDate: '2027-01-15', passwordInput: pin }),
    ]);
    expect(a.success && b.success).toBe(true);
    const recargos = presupuestos[0].itemsPresupuestados.filter((i: any) => String(i.idServicioCatalogo).startsWith('multa_cambio_fecha'));
    expect(recargos).toHaveLength(1);
    expect(recargos[0].costoTotalItem).toBe(1500);
    expect(presupuestos[0].costoTotalEstimado).toBe(16500);
    expect([a, b].filter((r) => r.yaEstaba).length).toBe(1);
  });

  it('si la fiesta no se guarda, no queda el recargo ni la fecha nueva en el presupuesto', async () => {
    guardarFiestaFalla = true;
    const r = await changeEventDate('f1', { newDate: '2027-01-15', passwordInput: pin });
    expect(r.success).toBe(false);
    expect(presupuestos[0].eventoFecha).toBe('2026-12-10');
    expect(presupuestos[0].costoTotalEstimado).toBe(15000);
    expect(presupuestos[0].itemsPresupuestados).toHaveLength(2);
  });
});

describe('aprobar el pago informado por el cliente', () => {
  const notif = { id: 'n1', monto: 500, estado: 'pendiente', fecha: '2026-10-01' };

  it('el mail de pago aprobado sale una sola vez aunque se apruebe dos veces a la vez', async () => {
    fiesta.clientPaymentNotifications = [{ ...notif }];
    const [a, b] = await Promise.all([approveClientPayment('f1', 'n1'), approveClientPayment('f1', 'n1')]);
    expect(a.success && b.success).toBe(true);
    await esperar();
    expect(mail).toHaveBeenCalledTimes(1);
  });

  it('sin presupuesto no se marca aprobado ni sale el mail', async () => {
    fiesta.presupuestoId = undefined;
    fiesta.clientPaymentNotifications = [{ ...notif }];
    const r = await approveClientPayment('f1', 'n1');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/no tiene presupuesto/i);
    expect(fiesta.clientPaymentNotifications[0].estado).toBe('pendiente');
    expect(mail).not.toHaveBeenCalled();
  });
});
