/**
 * MATAFUEGO — La firma del cliente en su portal es sólo una CONSTANCIA: la reserva sale del
 * contrato en papel (25 de septiembre de 2026, decisión del dueño: "las dos, papel obligatorio").
 *
 * Se probo rompiendolo: si `signContractDigitally` guarda en `contratoFirmaInfo` (que el resto
 * de la app lee como "contrato firmado"), pasa la fiesta a "Contratada" o anota la seña, la
 * primera se pone en rojo; si vuelve a existir un atajo digital para confirmar la reserva, la
 * tercera.
 */
let fiestaGuardada: any;
const parciales: any[] = [];

jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn(async () => true) }));
jest.mock('@/lib/auth/require-session', () => ({ requireAppSession: jest.fn(async () => undefined) }));
jest.mock('next/headers', () => ({ headers: jest.fn(async () => new Map([['x-forwarded-for', '1.2.3.4, 5.6.7.8']])) }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn(async () => undefined) }));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(), deleteFromStorage: jest.fn() }));
jest.mock('@/lib/invoices/leer-facturas', () => ({ leerFacturasSinGuardia: jest.fn(async () => []) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestoById: jest.fn(async () => null) }));
jest.mock('@/app/actions/invoices', () => ({ registerBookingDeposit: jest.fn(async () => ({ success: true, invoiceId: 'inv_sena' })) }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => JSON.parse(JSON.stringify(fiestaGuardada))),
  saveFiesta: jest.fn(async (f: any) => { fiestaGuardada = f; return { success: true }; }),
  updateFiestaPartial: jest.fn(async (_id: string, parcial: any) => {
    parciales.push(parcial);
    fiestaGuardada = { ...fiestaGuardada, ...parcial };
    return { success: true };
  }),
  syncFiestaFromBudget: jest.fn(async () => ({ success: true })),
}));

import * as Documentos from '@/app/actions/fiesta/documentos.actions';
import * as FiestaActual from '@/app/actions/fiesta-actual';
import { mapFiestaToClientPortal } from '@/lib/client-portal/public-fiesta';
const { signContractDigitally } = Documentos;
import { registerBookingDeposit } from '@/app/actions/invoices';

function fiestaDePrueba(extra: any = {}) {
  return {
    id: 'f1',
    estado: 'Presupuestada',
    configuracion: { nombreEvento: 'XV de Sofía' },
    contratoServicioTexto: 'Texto del contrato',
    ...extra,
  };
}

describe('La firma digital no da nada por aceptado', () => {
  beforeEach(() => {
    fiestaGuardada = fiestaDePrueba();
    parciales.length = 0;
    (registerBookingDeposit as jest.Mock).mockClear();
  });

  it('firmar deja la constancia aparte, sin marcar el contrato como firmado, sin contratar ni anotar seña', async () => {
    const r = await signContractDigitally('f1', 'Ana Pérez', false);
    expect(r.success).toBe(true);
    const c = fiestaGuardada.firmaDigitalConstancia;
    expect(c).toMatchObject({ signedBy: 'Ana Pérez', ip: '1.2.3.4', planPagosAceptado: false });
    expect(c.textoHuella).toMatch(/^[a-f0-9]{64}$/);
    expect(fiestaGuardada.contratoFirmaInfo).toBeUndefined();
    expect(fiestaGuardada.estado).toBe('Presupuestada');
    expect(registerBookingDeposit).not.toHaveBeenCalled();
    // Sólo se tocó la constancia, nada más de la fiesta.
    expect(Object.keys(parciales[0])).toEqual(['firmaDigitalConstancia']);
  });

  it('con plan de pagos, no se firma sin aceptarlo; y no se firma dos veces', async () => {
    fiestaGuardada = fiestaDePrueba({ contratoDatos: { planPagos: { activo: true } } });
    expect((await signContractDigitally('f1', 'Ana', false)).success).toBe(false);
    expect((await signContractDigitally('f1', 'Ana', true)).success).toBe(true);
    const primera = fiestaGuardada.firmaDigitalConstancia.signedAt;
    expect((await signContractDigitally('f1', 'Otro', true)).success).toBe(true);
    expect(fiestaGuardada.firmaDigitalConstancia.signedAt).toBe(primera);
    expect(fiestaGuardada.firmaDigitalConstancia.signedBy).toBe('Ana');
  });

  it('no hay atajo digital para confirmar la reserva: sólo el contrato en papel', () => {
    const nombres = [...Object.keys(Documentos), ...Object.keys(FiestaActual)];
    expect(nombres.filter((n) => /confirmar.*firma|firma.*digital.*reserva/i.test(n))).toEqual([]);
    expect(typeof Documentos.uploadPhysicalContract).toBe('function');
  });

  it('el cliente ve su constancia en el portal, pero no la IP', async () => {
    await signContractDigitally('f1', 'Ana Pérez', false);
    const vista: any = mapFiestaToClientPortal({ ...fiestaGuardada, clientPortalSettings: { enabled: true } });
    expect(vista.firmaDigitalConstancia.signedBy).toBe('Ana Pérez');
    expect(vista.firmaDigitalConstancia.ip).toBeUndefined();
  });
});
