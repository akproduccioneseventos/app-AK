/**
 * MATAFUEGO: un documento no se da por guardado si no se guardo.
 *
 * El archivo se sube a la nube y despues se guarda la ficha del evento. Si esa
 * segunda parte falla y nadie la mira, la pantalla dice "documento guardado", el
 * archivo esta ocupando lugar pagado y **no aparece en ningun lado**.
 *
 * Lo mismo, y peor, al firmar el contrato: la fiesta pasa a "Contratada", se abre el
 * portal del cliente y se genera la factura de sena. Si el guardado falla, el
 * contrato figura firmado y no hay nada de eso.
 */
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: {} }),
}));
jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn().mockResolvedValue('https://nube/archivo.pdf'),
  deleteFromStorage: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));
jest.mock('@/app/actions/invoices', () => ({ registerBookingDeposit: jest.fn() }));
jest.mock('@/lib/invoices/leer-facturas', () => ({ leerFacturasSinGuardia: jest.fn().mockResolvedValue([]) }));
jest.mock('@/lib/commercial-flow/ledger-service', () => ({ isDepositReceiptInvoice: () => false }));
jest.mock('@/lib/notifications/create-notification', () => ({ createNotification: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestoById: jest.fn().mockResolvedValue(null) }));
jest.mock('@/lib/security/portal-session', () => ({ verifyPortalSession: jest.fn() }));
jest.mock('next/headers', () => ({ headers: jest.fn().mockResolvedValue(new Map()) }));

import { uploadDocumento, deleteDocumento } from '@/app/actions/fiesta/documentos.actions';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';

const FIESTA = {
  id: 'fiesta-doc-1',
  configuracion: { nombreEvento: 'Fiesta de prueba' },
  othersDocumentos: [{ id: 'doc-viejo', fileName: 'viejo.pdf', nombre: 'Viejo' }],
} as any;

/**
 * El formulario se arma a mano, no con `FormData`.
 *
 * Dos intentos fallaron antes por el motivo equivocado: `FormData` guarda como
 * texto cualquier cosa que no sea un archivo de verdad, y el `File` de este entorno
 * de pruebas no sabe entregar sus bytes. Con esto la prueba llega a comprobar lo
 * que tiene que comprobar.
 */
function formularioConArchivo(fiestaId: string): FormData {
  const valores: Record<string, unknown> = {
    file: {
      name: 'contrato.pdf',
      type: 'application/pdf',
      arrayBuffer: async () => new Uint8Array([1, 2, 3, 4]).buffer,
    },
    docType: 'Otro',
    customName: 'Contrato',
    fiestaId,
  };
  return { get: (clave: string) => valores[clave] ?? null } as unknown as FormData;
}

describe('Los documentos no se dan por guardados si no se guardaron', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getFiestaById as jest.Mock).mockResolvedValue(FIESTA);
  });

  it('subir un documento: si el evento no se guarda, contesta que NO', async () => {
    (saveFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'No se pudo guardar el evento.' });

    const formulario = formularioConArchivo(FIESTA.id);

    const r = await uploadDocumento(formulario);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/no se pudo guardar/i);
  });

  it('subir un documento: si se guarda bien, contesta que si', async () => {
    (saveFiesta as jest.Mock).mockResolvedValue({ success: true });

    const formulario = formularioConArchivo(FIESTA.id);

    const r = await uploadDocumento(formulario);
    expect(r.success).toBe(true);
  });

  it('borrar un documento: si el evento no se guarda, contesta que NO', async () => {
    (saveFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'No se pudo guardar el evento.' });

    const r = await deleteDocumento(FIESTA.id, 'doc-viejo');
    expect(r.success).toBe(false);
  });
});
