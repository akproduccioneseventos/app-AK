jest.mock('@/lib/auth/event-access', () => ({ requireEventPermission: jest.fn() }));
jest.mock('@/lib/generic-json-store', () => ({ mutateGenericJsonArray: jest.fn() }));
jest.mock('@/lib/staff-agenda-conflicts', () => ({ getFiestaTimeRange: jest.fn() }));
jest.mock('@/lib/utils', () => ({ hoyEnUruguay: jest.fn(() => '2026-10-10') }));
jest.mock('@/lib/data-service', () => ({ readDataConDetalle: jest.fn() }));

import { requireEventPermission } from '@/lib/auth/event-access';
import { mutateGenericJsonArray } from '@/lib/generic-json-store';
import { getFiestaTimeRange } from '@/lib/staff-agenda-conflicts';
import { readDataConDetalle } from '@/lib/data-service';
import { guardarObservacionesPosfiesta, obtenerObservacionesFiestaPosfiesta, obtenerSugerenciasPosfiesta } from '@/app/actions/fiesta/observaciones-posfiesta.actions';

const fiesta = {
  id: 'f1',
  estado: 'Finalizada',
  configuracion: { fechaEvento: '2026-10-09', horaInicio: '20:00', horaFin: '02:00', tipoCelebracion: 'boda', invitadosEstimados: 150 },
  invitados: [{ partySize: 2, checkedIn: true }],
};
const entrada = [{ categoria: 'bebida' as const, tipo: 'sobro' as const, elemento: 'vino', cantidad: 2, unidad: 'cajas' }];

describe('guardar observaciones posfiesta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (requireEventPermission as jest.Mock).mockResolvedValue(fiesta);
    (getFiestaTimeRange as jest.Mock).mockReturnValue({ startMs: 0, endMs: Date.now() - 60_000, fechaStr: '2026-10-09' });
    (mutateGenericJsonArray as jest.Mock).mockImplementation(async (_path, change) => change([]));
  });

  it('usa permisos de evento OR y guarda atómicamente después del fin confirmado', async () => {
    await expect(guardarObservacionesPosfiesta('f1', entrada)).resolves.toMatchObject({ success: true });
    expect(requireEventPermission).toHaveBeenCalledWith('f1', ['administracion', 'organizacion']);
    expect(mutateGenericJsonArray).toHaveBeenCalledWith('observaciones-posfiesta.json', expect.any(Function));
  });

  it('no guarda mientras el rango horario del evento siga abierto', async () => {
    (getFiestaTimeRange as jest.Mock).mockReturnValue({ startMs: 0, endMs: Date.now() + 60_000, fechaStr: '2026-10-09' });
    await expect(guardarObservacionesPosfiesta('f1', entrada)).rejects.toThrow('Solo se pueden registrar observaciones');
    expect(mutateGenericJsonArray).not.toHaveBeenCalled();
  });

  it('reusa el documento sin reescritura para el mismo intento ya guardado', async () => {
    (mutateGenericJsonArray as jest.Mock).mockImplementation(async (_path, change) => {
      const existentes = change([]);
      return change(existentes) || existentes;
    });
    await expect(guardarObservacionesPosfiesta('f1', entrada)).resolves.toMatchObject({ success: true });
  });

  it('action consumidora retorna hechos propios y sugerencias históricas de otra fiesta', async () => {
    const propio = { id: 'f1:2026-10-09:bebida:sobro:vino:cajas', fiestaId: 'f1', fechaEvento: '2026-10-09', tipoEvento: 'boda', invitadosReales: 2, invitadosEstimados: 150, categoria: 'bebida' as const, tipo: 'sobro' as const, elemento: 'vino', cantidad: 2, unidad: 'cajas', actualizadoEn: '2026-10-10T12:00:00.000Z' };
    const historico = { ...propio, id: 'f0:2026-09-09:bebida:sobro:vino:cajas', fiestaId: 'f0', fechaEvento: '2026-09-09', invitadosReales: null, invitadosEstimados: 140 };
    (readDataConDetalle as jest.Mock).mockResolvedValue({ valor: [propio, historico], huboFalla: false });
    await expect(obtenerObservacionesFiestaPosfiesta('f1')).resolves.toEqual([propio]);
    await expect(obtenerSugerenciasPosfiesta('f1')).resolves.toMatchObject([
      { fiestaId: 'f0', invitadosReferencia: 140, baseInvitados: 'estimados', invitadosActuales: 150, baseInvitadosActuales: 'estimados' },
    ]);
    expect(requireEventPermission).toHaveBeenCalledWith('f1', ['administracion', 'organizacion']);
  });

  it('no presenta historial vacío cuando falla la lectura', async () => {
    (readDataConDetalle as jest.Mock).mockResolvedValue({ valor: [], huboFalla: true });
    await expect(obtenerSugerenciasPosfiesta('f1')).rejects.toThrow('No se pudo leer el historial');
  });
});
