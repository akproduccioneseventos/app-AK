jest.mock('@/lib/generic-json-store', () => ({ mutateGenericJsonArray: jest.fn() }));
jest.mock('@/lib/data-service', () => ({ readDataConDetalle: jest.fn() }));
jest.mock('@/lib/utils', () => ({ hoyEnUruguay: (date: Date) => date.toISOString().slice(0, 10) }));
jest.mock('@/lib/staff-agenda-conflicts', () => ({ getFiestaTimeRange: jest.fn(() => ({ endMs: 0 })) }));
jest.mock('@/lib/fiesta/informe-automatico', () => ({ armarInformeAutomatico: jest.fn(() => ({ id: 'informe-posfiesta-fiesta-1-2026-10-28', fechaGeneracion: '2026-10-29T12:00:00.000Z', propuestaResumenDuenio: 'Resumen interno' })) }));
jest.mock('@/lib/ia/reglas-de-la-ia', () => ({ getReglaParaTarea: jest.fn() }));
jest.mock('@/lib/presencia-digital/autogenerador-semanal', () => ({ generarBorradoresPosfiesta: jest.fn() }));

import { getReglaParaTarea } from '@/lib/ia/reglas-de-la-ia';
import { generarBorradoresPosfiesta } from '@/lib/presencia-digital/autogenerador-semanal';
import { ejecutarCierrePosfiesta, type DependenciasCierrePosfiesta } from './cierre-posfiesta';

const regla = getReglaParaTarea as jest.Mock;
const generar = generarBorradoresPosfiesta as jest.Mock;
const fiesta: any = {
  id: 'fiesta-1', estado: 'Confirmada', configuracion: { fechaEvento: '2026-10-28', horaFin: '23:00', nombreEvento: 'Evento' },
};

function deps(overrides: Partial<DependenciasCierrePosfiesta> = {}): DependenciasCierrePosfiesta {
  return {
    leerFiestas: jest.fn().mockResolvedValue([fiesta]),
    leerInformes: jest.fn().mockResolvedValue([]),
    leerDatosConfirmados: jest.fn().mockResolvedValue({}),
    guardar: jest.fn().mockResolvedValue(true),
    generarBorradoresRedes: generar,
    ...overrides,
  };
}

describe('integración de borradores en cierre posfiesta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    regla.mockImplementation(async (task: string) => task === 'informe_posfiesta' ? 'preguntar' : 'preguntar');
    generar.mockResolvedValue({ createdCount: 2, posts: [{ id: 'post-1' }, { id: 'script-1' }] });
  });

  it('no consulta fiestas ni intenta redes si informe_posfiesta está apagado', async () => {
    regla.mockResolvedValue('apagada');
    const dependencies = deps();
    const result = await ejecutarCierrePosfiesta(new Date('2026-10-29T12:00:00.000Z'), dependencies);
    expect(result.errores).toEqual([]);
    expect(dependencies.leerFiestas).not.toHaveBeenCalled();
    expect(dependencies.leerInformes).not.toHaveBeenCalled();
    expect(generar).not.toHaveBeenCalled();
  });

  it('llama al helper aunque el informe ya exista y reintenta tras fallo previo', async () => {
    const existing = { id: 'informe-posfiesta-fiesta-1-2026-10-28', fechaGeneracion: '2026-10-29T12:00:00.000Z', propuestaResumenDuenio: 'Resumen guardado' };
    const dependencies = deps({ leerInformes: jest.fn().mockResolvedValue([existing]) });
    generar.mockRejectedValueOnce(new Error('Fallo transitorio al guardar borradores'))
      .mockResolvedValueOnce({ createdCount: 2, posts: [{ id: 'post-1' }, { id: 'script-1' }] });

    const primera = await ejecutarCierrePosfiesta(new Date('2026-10-29T12:00:00.000Z'), dependencies);
    expect(primera.errores).toEqual([expect.objectContaining({ fiestaId: 'fiesta-1', error: 'Fallo transitorio al guardar borradores' })]);
    expect(primera.preparados).toBe(0);
    expect(generar).toHaveBeenNthCalledWith(1, 'fiesta-1', '2026-10-28', new Date('2026-10-29T12:00:00.000Z'));

    const segunda = await ejecutarCierrePosfiesta(new Date('2026-10-29T12:00:00.000Z'), dependencies);
    expect(segunda.errores).toEqual([]);
    expect(segunda.preparados).toBe(0);
    expect(generar).toHaveBeenCalledTimes(2);
  });

  it('respeta el interruptor propio de redes sin llamar helper', async () => {
    regla.mockImplementation(async (task: string) => task === 'borradores_redes_posfiesta' ? 'apagada' : 'preguntar');
    const result = await ejecutarCierrePosfiesta(new Date('2026-10-29T12:00:00.000Z'), deps());
    expect(result.errores).toEqual([]);
    expect(generar).not.toHaveBeenCalled();
  });
});
