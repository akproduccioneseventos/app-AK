/** @jest-environment node */
import { uploadPhysicalContract } from '@/app/actions/fiesta/documentos.actions';
import { addInvoiceId } from '@/app/actions/fiesta/fiesta.actions';
import { registerBookingDeposit } from '@/app/actions/invoices';

process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

const almacen: Record<string, any> = {};
const stored: any[] = [];

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => undefined),
  requirePermiso: jest.fn(async () => ({ ok: true })),
  requirePermisoAlguno: jest.fn(async () => ({ ok: true })),
}));

jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => true),
}));

jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn(async () => ({
    success: true,
    user: { userId: 'admin-1', role: 'admin', perfil: 'admin' },
  })),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => new Map()),
  cookies: jest.fn(async () => ({
    get: jest.fn(() => ({ value: 'test-token' })),
  })),
}));

jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(async () => undefined),
  deleteFromStorage: jest.fn(),
}));

jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => undefined),
}));

jest.mock('@/lib/invoices/leer-facturas', () => ({
  leerFacturasSinGuardia: jest.fn(async () => []),
}));

jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(async () => null),
}));

jest.mock('@/app/actions/invoices', () => ({
  registerBookingDeposit: jest.fn(),
}));

jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async (archivo: string, porDefecto: any) => {
    const guardado = almacen[archivo];
    return guardado === undefined ? porDefecto : JSON.parse(JSON.stringify(guardado));
  }),
  writeData: jest.fn(async (archivo: string, datos: any) => {
    almacen[archivo] = JSON.parse(JSON.stringify(datos));
    stored.push(JSON.parse(JSON.stringify(datos)));
  }),
  mutateDataItem: jest.fn(),
  createDataItem: jest.fn(),
  updateDataItem: jest.fn(),
  deleteDataItem: jest.fn(),
}));

const form = () =>
  ({
    get: (name: string) =>
      name === 'fiestaId'
        ? 'qa128-contrato'
        : name === 'file'
        ? {
            name: 'qa128.pdf',
            type: 'application/pdf',
            arrayBuffer: async () => new Uint8Array([37, 80, 68, 70, 45]).buffer,
          }
        : null,
  } as unknown as FormData);

beforeEach(() => {
  stored.length = 0;
  jest.clearAllMocks();
  for (const k of Object.keys(almacen)) delete almacen[k];
  almacen['fiestas/qa128-contrato.json'] = {
    id: 'qa128-contrato',
    configuracion: { nombreEvento: 'Contrato ficticio QA128' },
    estado: 'Presupuestada',
    tareas: [],
  };
});

describe('Contrato físico y recibo de seña automático', () => {
  test('control positivo: si recibo y contrato se guardan, quedan enlazados y sin reciboSenaPendiente', async () => {
    (registerBookingDeposit as jest.Mock).mockResolvedValue({ success: true, invoiceId: 'qa128-recibo' });

    const result = await uploadPhysicalContract(form());

    expect(result.success).toBe(true);
    expect(result.reciboPendiente).toBeUndefined();
    const guardada = almacen['fiestas/qa128-contrato.json'];
    expect(guardada.invoiceIds).toEqual(['qa128-recibo']);
    expect(guardada.estado).toBe('Contratada');
    expect(guardada.reciboSenaPendiente).toBeUndefined();
  });

  test('si registerBookingDeposit devuelve success:false, devuelve reciboPendiente y guarda reciboSenaPendiente en la fiesta', async () => {
    (registerBookingDeposit as jest.Mock).mockResolvedValue({
      success: false,
      error: 'QA128 no se pudo guardar el recibo',
    });

    const result = await uploadPhysicalContract(form());

    expect(result.success).toBe(true);
    expect(result.reciboPendiente).toBe('QA128 no se pudo guardar el recibo');
    expect(result.warning).toBe('QA128 no se pudo guardar el recibo');
    const guardada = almacen['fiestas/qa128-contrato.json'];
    expect(guardada.estado).toBe('Contratada');
    expect(guardada.reciboSenaPendiente).toEqual({
      motivo: 'QA128 no se pudo guardar el recibo',
      fecha: expect.any(String),
    });
  });

  test('si registerBookingDeposit tira excepcion, devuelve reciboPendiente y guarda reciboSenaPendiente', async () => {
    (registerBookingDeposit as jest.Mock).mockRejectedValue(new Error('Falla de red en factura'));

    const result = await uploadPhysicalContract(form());

    expect(result.success).toBe(true);
    expect(result.reciboPendiente).toBe('Falla de red en factura');
    const guardada = almacen['fiestas/qa128-contrato.json'];
    expect(guardada.estado).toBe('Contratada');
    expect(guardada.reciboSenaPendiente).toEqual({
      motivo: 'Falla de red en factura',
      fecha: expect.any(String),
    });
  });

  test('addInvoiceId con esReciboDeSena borra reciboSenaPendiente, mientras que otra factura no lo borra', async () => {
    almacen['fiestas/qa128-contrato.json'].reciboSenaPendiente = {
      motivo: 'Falta recibo previo',
      fecha: new Date().toISOString(),
    };

    // Otra factura cualquiera que se engancha (sin esReciboDeSena)
    await addInvoiceId('qa128-contrato', 'inv_otra_123');
    expect(almacen['fiestas/qa128-contrato.json'].reciboSenaPendiente).toBeDefined();

    // Recibo de seña que por fin se engancha
    await addInvoiceId('qa128-contrato', 'inv_sena_real', { esReciboDeSena: true });
    expect(almacen['fiestas/qa128-contrato.json'].reciboSenaPendiente).toBeUndefined();
    expect(almacen['fiestas/qa128-contrato.json'].invoiceIds).toContain('inv_sena_real');
  });
});

