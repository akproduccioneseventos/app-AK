/**
 * @jest-environment node
 *
 * Orden 168 - Bloque 5: Plata (centavos y negativos).
 * - Costos de insumos: 6.50 con +10% da 7.15 (centavos respetados).
 * - Servidor valida que los montos sean finitos y >= 0:
 *   1. updateGestionCostos (costos.actions.ts)
 *   2. importarPresupuestoDesdeTexto (presupuestos.ts)
 *   3. createAprobacion (approvals.ts)
 *   4. saveSocialPost (social-media.ts)
 *   Rechaza -1, NaN, Infinity con error claro; acepta 0.
 */

process.env.AK_USE_LOCAL_JSON_ONLY = 'true';

// --- Mocks de sesión y permisos ---
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: { role: 'admin' } }),
  requirePermisoAlguno: jest.fn().mockResolvedValue({ ok: true, user: { role: 'admin' } }),
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { role: 'admin' } }),
  verifySessionConPermiso: jest.fn().mockResolvedValue({ success: true, user: { role: 'admin' } }),
}));
jest.mock('@/lib/auth/session-token', () => ({
  verifySession: jest.fn().mockResolvedValue({ success: true, user: { role: 'admin' } }),
}));
jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn().mockResolvedValue(undefined),
}));

// --- Mock de data-service ---
const mockReadData = jest.fn();
const mockWriteData = jest.fn();
const mockCreateDataItem = jest.fn();
const mockMutateDataItem = jest.fn();
const mockDeleteDataItem = jest.fn();
jest.mock('@/lib/data-service', () => ({
  readData: (...args: unknown[]) => mockReadData(...args),
  readDataConDetalle: jest.fn().mockImplementation(async (...args: unknown[]) => ({
    valor: await mockReadData(...args),
    huboFalla: false,
  })),
  writeData: (...args: unknown[]) => mockWriteData(...args),
  createDataItem: (...args: unknown[]) => mockCreateDataItem(...args),
  mutateDataItem: (...args: unknown[]) => mockMutateDataItem(...args),
  deleteDataItem: (...args: unknown[]) => mockDeleteDataItem(...args),
}));

// --- Mock de fiesta.actions ---
const mockUpdateFiestaPartial = jest.fn().mockResolvedValue({ success: true });
// Los costos que recalcula el servidor se guardan por costos-interno (orden 183): mismo destino que
// el updateFiestaPartial de mentira de esta prueba.
jest.mock('@/lib/fiesta/costos-interno', () => ({
  guardarCostosInterno: async (id: string, costos: unknown) => {
    const r = await require('@/app/actions/fiesta/fiesta.actions').updateFiestaPartial(id, { gestionCostos: costos });
    return r?.success ? { success: true, updatedData: costos } : { success: false, error: r?.error };
  },
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  updateFiestaPartial: (...args: unknown[]) => mockUpdateFiestaPartial(...args),
  getFiestaById: jest.fn().mockResolvedValue(null),
  saveFiesta: jest.fn().mockResolvedValue({ success: true }),
}));

// --- Mock de storage ---
jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn().mockResolvedValue('https://test.com/img.jpg'),
}));

// Imports
import { previewPriceAdjustment } from '@/app/actions/price-adjustments';
import { adjustAllServiceCosts } from '@/app/actions/servicios-empresa';
import { updateGestionCostos } from '@/app/actions/fiesta/costos.actions';
import { importarPresupuestoDesdeTexto } from '@/app/actions/presupuestos';
import { createAprobacion } from '@/app/actions/approvals';
import { saveSocialPost } from '@/app/actions/social-media';

beforeEach(() => {
  jest.clearAllMocks();
  mockReadData.mockResolvedValue([]);
  mockWriteData.mockResolvedValue(true);
  mockCreateDataItem.mockResolvedValue({ success: true, id: 'item_1' });
});

describe('Orden 168 - Bloque 5: Costos de insumos con centavos (6.50 + 10% = 7.15)', () => {
  test('previewPriceAdjustment calcula costoNuevo con 2 decimales exactos', async () => {
    mockReadData.mockImplementation(async (file: string) => {
      if (file.includes('servicios')) {
        return [{ id: 'srv_1', nombre: 'Refresco', categoria: 'Bar', valorUnitarioEstimado: 6.50 }];
      }
      return [];
    });

    const res = await previewPriceAdjustment(10, 'costos');
    expect(res.success).toBe(true);
    expect(res.preview).toBeDefined();
    expect(res.preview![0].costoNuevo).toBe(7.15);
  });

  test('adjustAllServiceCosts persiste valorUnitarioEstimado con 2 decimales', async () => {
    mockReadData.mockImplementation(async (file: string) => {
      if (file.includes('servicios')) {
        return [{ id: 'srv_1', nombre: 'Refresco', categoria: 'Bar', valorUnitarioEstimado: 6.50 }];
      }
      return [];
    });

    const res = await adjustAllServiceCosts(10);
    expect(res.success).toBe(true);
    expect(mockWriteData).toHaveBeenCalledWith(
      expect.stringContaining('servicios'),
      expect.arrayContaining([
        expect.objectContaining({ valorUnitarioEstimado: 7.15 }),
      ]),
      expect.anything()
    );
  });
});

describe('Orden 168 - Bloque 5: Validaciones de finitud y >= 0', () => {
  describe('updateGestionCostos', () => {
    test('rechaza -1, NaN e Infinity con mensaje claro', async () => {
      const resNegativo = await updateGestionCostos('f1', {
        costosItems: [{ id: '1', descripcion: 'Sonido', montoEstimado: -1 }],
      } as any);
      expect(resNegativo.success).toBe(false);
      expect(resNegativo.error).toMatch(/mayor o igual a 0/);

      const resNaN = await updateGestionCostos('f1', {
        costosItems: [{ id: '1', descripcion: 'Sonido', montoEstimado: NaN }],
      } as any);
      expect(resNaN.success).toBe(false);
      expect(resNaN.error).toMatch(/mayor o igual a 0/);

      const resInf = await updateGestionCostos('f1', {
        costosItems: [{ id: '1', descripcion: 'Sonido', montoEstimado: Infinity }],
      } as any);
      expect(resInf.success).toBe(false);
      expect(resInf.error).toMatch(/mayor o igual a 0/);
    });

    test('acepta montoEstimado = 0', async () => {
      mockUpdateFiestaPartial.mockResolvedValueOnce({ success: true });
      const resCero = await updateGestionCostos('f1', {
        costosItems: [{ id: '1', descripcion: 'Sonido', montoEstimado: 0 }],
      } as any);
      expect(resCero.success).toBe(true);
    });
  });

  describe('importarPresupuestoDesdeTexto', () => {
    const textoValido = 'Presupuesto para Juan Perez\nFecha: 2026-12-20\nTotal: 100000\nServicios: DJ completo y luces.';

    test('rechaza senaManual negativa, NaN e Infinity', async () => {
      const rNeg = await importarPresupuestoDesdeTexto(textoValido, { senaManual: -1 });
      expect(rNeg.success).toBe(false);
      expect(rNeg.error).toMatch(/mayor o igual a 0/);

      const rNaN = await importarPresupuestoDesdeTexto(textoValido, { senaManual: NaN });
      expect(rNaN.success).toBe(false);
      expect(rNaN.error).toMatch(/mayor o igual a 0/);

      const rInf = await importarPresupuestoDesdeTexto(textoValido, { senaManual: Infinity });
      expect(rInf.success).toBe(false);
      expect(rInf.error).toMatch(/mayor o igual a 0/);
    });

    test('acepta senaManual = 0', async () => {
      const rCero = await importarPresupuestoDesdeTexto(textoValido, { senaManual: 0 });
      // Si la seña manual es 0, no debe fallar por la validación de seña
      if (!rCero.success) {
        expect(rCero.error).not.toMatch(/mayor o igual a 0/);
      } else {
        expect(rCero.success).toBe(true);
      }
    });
  });

  describe('createAprobacion', () => {
    const baseAprobacion = {
      fiestaId: 'f1',
      titulo: 'Modificación técnica',
      categoria: 'logistica' as const,
      descripcion: 'Detalle de prueba',
      solicitadoPor: 'Admin',
    };

    test('rechaza impactoEconomico negativo, NaN e Infinity', async () => {
      const rNeg = await createAprobacion({ ...baseAprobacion, impactoEconomico: -1 });
      expect(rNeg.success).toBe(false);
      expect(rNeg.error).toMatch(/mayor o igual a 0/);

      const rNaN = await createAprobacion({ ...baseAprobacion, impactoEconomico: NaN });
      expect(rNaN.success).toBe(false);
      expect(rNaN.error).toMatch(/mayor o igual a 0/);

      const rInf = await createAprobacion({ ...baseAprobacion, impactoEconomico: Infinity });
      expect(rInf.success).toBe(false);
      expect(rInf.error).toMatch(/mayor o igual a 0/);
    });

    test('acepta impactoEconomico = 0', async () => {
      mockReadData.mockResolvedValue([]);
      const rCero = await createAprobacion({ ...baseAprobacion, impactoEconomico: 0 });
      expect(rCero.success).toBe(true);
      expect(rCero.aprobacion?.impactoEconomico).toBe(0);
    });
  });

  describe('saveSocialPost', () => {
    function crearFormData(costo: string) {
      const fd = new FormData();
      fd.append('platform', 'instagram');
      fd.append('text', 'Publicación de prueba para redes');
      fd.append('publishDate', '2026-11-01');
      fd.append('promotionCost', costo);
      return fd;
    }

    test('rechaza costo de promoción negativo, no numérico o Infinity', async () => {
      mockReadData.mockResolvedValue([]);

      const rNeg = await saveSocialPost(crearFormData('-1'));
      expect(rNeg.success).toBe(false);
      expect(rNeg.error).toMatch(/mayor o igual a 0/);

      const rNaN = await saveSocialPost(crearFormData('no-es-numero'));
      expect(rNaN.success).toBe(false);
      expect(rNaN.error).toMatch(/mayor o igual a 0/);

      const rInf = await saveSocialPost(crearFormData('Infinity'));
      expect(rInf.success).toBe(false);
      expect(rInf.error).toMatch(/mayor o igual a 0/);
    });

    test('acepta costo de promoción = 0', async () => {
      mockReadData.mockResolvedValue([]);
      const rCero = await saveSocialPost(crearFormData('0'));
      expect(rCero.success).toBe(true);
      expect(rCero.post?.promotionCost).toBe(0);
    });
  });
});
