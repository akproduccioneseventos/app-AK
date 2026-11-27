process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

const saveFiestaMock = jest.fn(async (f: any) => ({ success: true, updatedData: f }));
const getFiestaByIdMock = jest.fn();

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'u1', perfil: 'dueno' } }),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: { id: 'u1', perfil: 'dueno' } }),
  requirePermisoAlguno: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/auth/solo-lectura', () => ({
  esSesionDeAuditor: jest.fn().mockResolvedValue(false),
  exigirQueSePuedaGuardar: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn().mockResolvedValue('https://cdn/contrato.pdf'),
  deleteFromStorage: jest.fn(),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: (...args: any[]) => getFiestaByIdMock(...args),
  saveFiesta: (...args: any[]) => saveFiestaMock(...args),
  syncFiestaFromBudget: jest.fn().mockResolvedValue({ success: true }),
}));
jest.mock('@/lib/invoices/leer-facturas', () => ({
  leerFacturasSinGuardia: jest.fn(async () => [
    {
      id: 'inv_sena_existente',
      documentKind: 'deposit_receipt',
      sourceFiestaId: 'f_cont_363',
      totalAmount: 5000,
    },
  ]),
}));
jest.mock('@/app/actions/invoices', () => ({
  registerBookingDeposit: jest.fn(),
}));
jest.mock('@/app/actions/settings', () => ({
  getBudgetDisplaySettings: jest.fn().mockResolvedValue({ bookingDepositAmount: 5000 }),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn().mockResolvedValue(null),
}));
jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn().mockResolvedValue({ success: true }),
}));

import { uploadPhysicalContract } from '@/app/actions/fiesta/documentos.actions';
import { registerBookingDeposit } from '@/app/actions/invoices';

describe('Orden 363: el reintento del contrato engancha la seña existente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getFiestaByIdMock.mockResolvedValue({
      id: 'f_cont_363',
      estado: 'En planificación',
      configuracion: { nombreEvento: 'Boda', presupuestoEstimado: 100000 },
      invoiceIds: [],
      reciboSenaPendiente: { motivo: 'Fallo anterior', fecha: '2026-11-25' },
    });
  });

  it('si ya existe recibo de seña para la fiesta con invoiceIds vacío, lo agrega a invoiceIds y no crea otro recibo', async () => {
    const fields: Record<string, any> = {
      fiestaId: 'f_cont_363',
      file: { name: 'contrato.pdf', type: 'application/pdf', arrayBuffer: async () => new ArrayBuffer(4) },
    };
    const fd = { get: (k: string) => fields[k] ?? null } as unknown as FormData;

    const res = await uploadPhysicalContract(fd);
    expect(res.success).toBe(true);
    expect(registerBookingDeposit).not.toHaveBeenCalled();
    expect(saveFiestaMock).toHaveBeenCalledTimes(1);
    const saved = saveFiestaMock.mock.calls[0][0];
    expect(saved.invoiceIds).toContain('inv_sena_existente');
    expect(saved.reciboSenaPendiente).toBeUndefined();
  });
});
