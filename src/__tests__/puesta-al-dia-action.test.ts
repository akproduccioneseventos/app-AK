jest.mock('@/lib/auth/require-session', () => ({ requirePermiso: jest.fn() }));
jest.mock('@/app/actions/presupuestos', () => ({ getPresupuestos: jest.fn() }));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestas: jest.fn(),
  getHistorialFiestas: jest.fn(),
}));
jest.mock('@/lib/commercial-flow/puesta-al-dia', () => ({
  buildPuestaAlDiaReporte: jest.fn(),
}));

import { getPuestaAlDiaReport } from '@/app/actions/puesta-al-dia';
import { requirePermiso } from '@/lib/auth/require-session';
import { getPresupuestos } from '@/app/actions/presupuestos';
import { getFiestas, getHistorialFiestas } from '@/app/actions/fiesta/fiesta.actions';
import { buildPuestaAlDiaReporte } from '@/lib/commercial-flow/puesta-al-dia';

const mockRequirePermiso = jest.mocked(requirePermiso);
const mockGetPresupuestos = jest.mocked(getPresupuestos);
const mockGetFiestas = jest.mocked(getFiestas);
const mockGetHistorialFiestas = jest.mocked(getHistorialFiestas);
const mockBuildPuestaAlDiaReporte = jest.mocked(buildPuestaAlDiaReporte);

describe('accion de puesta al dia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('no lee datos financieros cuando falta el permiso contable', async () => {
    mockRequirePermiso.mockResolvedValue({ ok: false, error: 'No autorizado' });

    await expect(getPuestaAlDiaReport()).resolves.toEqual({
      success: false,
      error: 'No autorizado',
    });
    expect(mockGetPresupuestos).not.toHaveBeenCalled();
    expect(mockGetFiestas).not.toHaveBeenCalled();
    expect(mockGetHistorialFiestas).not.toHaveBeenCalled();
  });

  it('lee una sola vez los eventos activos y el historial por separado', async () => {
    const report = {
      totales: {
        fiestasRevisadas: 0,
        yaPasaron: 0,
        paraCobrar: 0,
        paraOrdenar: 0,
        plataPendiente: 0,
      },
      items: [],
    };
    mockRequirePermiso.mockResolvedValue({ ok: true });
    mockGetPresupuestos.mockResolvedValue([]);
    mockGetFiestas.mockResolvedValue([]);
    mockGetHistorialFiestas.mockResolvedValue([{ presupuestoId: 'pres-archivado' }]);
    mockBuildPuestaAlDiaReporte.mockReturnValue(report);

    const result = await getPuestaAlDiaReport();

    expect(result.success).toBe(true);
    expect(mockGetFiestas).toHaveBeenCalledTimes(1);
    expect(mockGetFiestas).toHaveBeenCalledWith(false);
    expect(mockGetHistorialFiestas).toHaveBeenCalledTimes(1);
    expect(mockBuildPuestaAlDiaReporte).toHaveBeenCalledWith(
      [],
      [],
      expect.any(Date),
      new Set(['pres-archivado']),
    );
  });
});
