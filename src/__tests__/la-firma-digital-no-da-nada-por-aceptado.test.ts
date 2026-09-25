/**
 * MATAFUEGO — La firma digital del cliente queda registrada, pero la reserva y la seña las
 * confirma una persona del equipo (25 de septiembre de 2026, decisión del dueño).
 *
 * Se probo rompiendolo: si `signContractDigitally` pasa la fiesta a "Contratada" o registra la
 * seña, la primera se pone en rojo; si la confirmación no pide sesión del equipo, la tercera.
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

import { signContractDigitally, confirmarReservaDeFirmaDigital } from '@/app/actions/fiesta/documentos.actions';
import { registerBookingDeposit } from '@/app/actions/invoices';
import { requireAppSession } from '@/lib/auth/require-session';

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

  it('firmar registra quién, cuándo y qué texto, sin contratar ni anotar seña', async () => {
    const r = await signContractDigitally('f1', 'Ana Pérez', false);
    expect(r.success).toBe(true);
    const firma = fiestaGuardada.contratoFirmaInfo;
    expect(firma).toMatchObject({ isSigned: true, method: 'digital', signedBy: 'Ana Pérez', ip: '1.2.3.4', pendienteDeConfirmar: true });
    expect(firma.textoHuella).toMatch(/^[a-f0-9]{64}$/);
    expect(fiestaGuardada.estado).toBe('Presupuestada');
    expect(registerBookingDeposit).not.toHaveBeenCalled();
    // Sólo se tocó la firma, nada más de la fiesta.
    expect(Object.keys(parciales[0])).toEqual(['contratoFirmaInfo']);
  });

  it('con plan de pagos, no se firma sin aceptarlo; y no se firma dos veces', async () => {
    fiestaGuardada = fiestaDePrueba({ contratoDatos: { planPagos: { activo: true } } });
    expect((await signContractDigitally('f1', 'Ana', false)).success).toBe(false);
    expect((await signContractDigitally('f1', 'Ana', true)).success).toBe(true);
    const primera = fiestaGuardada.contratoFirmaInfo.signedAt;
    expect((await signContractDigitally('f1', 'Otro', true)).success).toBe(true);
    expect(fiestaGuardada.contratoFirmaInfo.signedAt).toBe(primera);
    expect(fiestaGuardada.contratoFirmaInfo.signedBy).toBe('Ana');
  });

  it('la reserva la confirma el equipo: pide sesión, contrata y anota la seña una vez', async () => {
    await signContractDigitally('f1', 'Ana Pérez', false);
    (requireAppSession as jest.Mock).mockRejectedValueOnce(new Error('Sesion no autorizada.'));
    await expect(confirmarReservaDeFirmaDigital('f1')).rejects.toThrow();
    expect(fiestaGuardada.estado).toBe('Presupuestada');

    const r = await confirmarReservaDeFirmaDigital('f1');
    expect(r.success).toBe(true);
    expect(fiestaGuardada.estado).toBe('Contratada');
    expect(fiestaGuardada.contratoFirmaInfo.pendienteDeConfirmar).toBe(false);
    expect(registerBookingDeposit).toHaveBeenCalledTimes(1);

    await confirmarReservaDeFirmaDigital('f1');
    expect(registerBookingDeposit).toHaveBeenCalledTimes(1);
  });
});
