/** @jest-environment node */

const copia = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

let fiestaDb: any;
let duranteUpload: (() => void) | null = null;
let duranteDelete: (() => void) | null = null;

jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(async () => ({ ok: true, user: { userId: 'u1', perfil: 'dueno' } })),
}));
jest.mock('@/lib/security/portal-session', () => ({
  verifyPortalSession: jest.fn(async () => false),
}));
jest.mock('@/lib/notifications/create-notification', () => ({
  createNotification: jest.fn(async () => undefined),
}));
jest.mock('@/app/actions/invoices', () => ({
  registerBookingDeposit: jest.fn(),
}));
jest.mock('@/app/actions/presupuestos', () => ({
  getPresupuestoById: jest.fn(async () => null),
}));
jest.mock('@/app/actions/settings', () => ({
  getBudgetDisplaySettings: jest.fn(async () => null),
}));
jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(async () => {
    if (duranteUpload) duranteUpload();
    return 'https://storage.test/nuevo-doc.pdf';
  }),
  deleteFromStorage: jest.fn(async () => {
    if (duranteDelete) duranteDelete();
  }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => copia(fiestaDb)),
  saveFiesta: jest.fn(async () => {
    throw new Error('No debe usar saveFiesta con una copia vieja de la fiesta.');
  }),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, fn: (actual: any) => any) => {
    const next = await fn(copia(fiestaDb));
    fiestaDb = copia(next);
    return { success: true, updatedFiesta: copia(fiestaDb) };
  }),
}));

import { uploadDocumento, deleteDocumento } from '@/app/actions/fiesta/documentos.actions';

describe('Orden 368 B4.1 — Los documentos de la fiesta no se pisan', () => {
  beforeEach(() => {
    duranteUpload = null;
    duranteDelete = null;
    fiestaDb = {
      id: 'f_docs',
      configuracion: { nombreEvento: 'Boda Docs' },
      othersDocumentos: [
        {
          id: 'doc_inicial',
          nombre: 'Contrato inicial',
          tipo: 'Contrato',
          fileName: 'https://storage.test/inicial.pdf',
          timestamp: '2026-11-26T10:00:00.000Z',
        },
      ],
    };
  });

  it('una adenda agregada mientras sube un archivo sigue estando después de subir', async () => {
    duranteUpload = () => {
      fiestaDb.othersDocumentos.push({
        id: 'doc_adenda_en_medio',
        nombre: 'Adenda cambio de fecha',
        tipo: 'Adenda',
        fileName: 'https://storage.test/adenda.pdf',
        timestamp: '2026-11-26T10:01:00.000Z',
      });
    };

    const formData = new FormData();
    formData.append('fiestaId', 'f_docs');
    formData.append('docType', 'Otro');
    formData.append('customName', 'Comprobante nuevo');
    formData.append('file', new Blob(['pdf'], { type: 'application/pdf' }), 'comp.pdf');

    const res = await uploadDocumento(formData);
    expect(res.success).toBe(true);

    const nombres = fiestaDb.othersDocumentos.map((d: any) => d.nombre);
    expect(nombres).toContain('Contrato inicial');
    expect(nombres).toContain('Adenda cambio de fecha');
    expect(nombres).toContain('Comprobante nuevo');
  });

  it('un documento agregado mientras se borra otro no desaparece al terminar el borrado', async () => {
    duranteDelete = () => {
      fiestaDb.othersDocumentos.push({
        id: 'doc_agregado_durante_borrado',
        nombre: 'Recibo paralelo',
        tipo: 'Recibo',
        fileName: 'https://storage.test/recibo.pdf',
        timestamp: '2026-11-26T10:02:00.000Z',
      });
    };

    const res = await deleteDocumento('f_docs', 'doc_inicial');
    expect(res.success).toBe(true);

    const ids = fiestaDb.othersDocumentos.map((d: any) => d.id);
    expect(ids).not.toContain('doc_inicial');
    expect(ids).toContain('doc_agregado_durante_borrado');
  });
});
