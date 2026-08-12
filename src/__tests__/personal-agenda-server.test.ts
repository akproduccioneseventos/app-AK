jest.mock('@/lib/auth/require-session', () => ({
  requirePermiso: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  getFiestas: jest.fn(),
  saveFiesta: jest.fn(),
}));

jest.mock('@/lib/staff-agenda-conflicts', () => ({
  evaluarAgendaEmpleado: jest.fn(),
}));
jest.mock('@/app/actions/empleados', () => ({
  getEmpleados: jest.fn(),
}));

jest.mock('@/app/actions/google-workspace', () => ({
  syncFiestaToGoogleWorkspace: jest.fn(),
}));

jest.mock('@/lib/staff-agenda-lock', () => ({
  acquireStaffAgendaLocks: jest.fn(async () => jest.fn(async () => undefined)),
}));

jest.mock('@/lib/staff-agenda-data', () => ({
  readActiveFiestasForStaffAgenda: jest.fn(),
}));

import { updatePersonal } from '@/app/actions/fiesta/personal.actions';
import { requirePermiso } from '@/lib/auth/require-session';
import { getFiestaById, getFiestas, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { getEmpleados } from '@/app/actions/empleados';
import { evaluarAgendaEmpleado } from '@/lib/staff-agenda-conflicts';
import { syncFiestaToGoogleWorkspace } from '@/app/actions/google-workspace';
import { readActiveFiestasForStaffAgenda } from '@/lib/staff-agenda-data';

const mockRequirePermiso = requirePermiso as jest.MockedFunction<typeof requirePermiso>;
const mockGetFiestaById = getFiestaById as jest.MockedFunction<typeof getFiestaById>;
const mockGetFiestas = getFiestas as jest.MockedFunction<typeof getFiestas>;
const mockSaveFiesta = saveFiesta as jest.MockedFunction<typeof saveFiesta>;
const mockEvaluarAgenda = evaluarAgendaEmpleado as jest.MockedFunction<typeof evaluarAgendaEmpleado>;
const mockGetEmpleados = getEmpleados as jest.MockedFunction<typeof getEmpleados>;
const mockGoogleSync = syncFiestaToGoogleWorkspace as jest.MockedFunction<typeof syncFiestaToGoogleWorkspace>;
const mockReadAgenda = readActiveFiestasForStaffAgenda as jest.MockedFunction<typeof readActiveFiestasForStaffAgenda>;

const fiestaBase = {
  id: 'fiesta-target',
  configuracion: {
    nombreEvento: 'Fiesta objetivo',
    fechaEvento: '2026-11-20',
    horaInicio: '21:00',
    horaFin: '04:00',
  },
  personalAsignado: [],
} as any;

const sinConflictos = {
  mismoDiaNoSolapado: [],
  solapadas: [],
  horarioSinConfirmar: [],
};

describe('bloqueo de agenda al guardar personal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequirePermiso.mockResolvedValue({ ok: true } as any);
    mockGetFiestaById.mockResolvedValue(fiestaBase);
    mockGetFiestas.mockResolvedValue([]);
    mockReadAgenda.mockResolvedValue([]);
    mockGetEmpleados.mockResolvedValue([{ id: 'emp-1', nombre: 'Ana' }] as any);
    mockEvaluarAgenda.mockReturnValue(sinConflictos);
    mockSaveFiesta.mockResolvedValue({ success: true, fiesta: fiestaBase });
    mockGoogleSync.mockResolvedValue({ success: true, warnings: [] });
  });

  it('lee la agenda una sola vez aunque se asignen varias personas', async () => {
    mockGetEmpleados.mockResolvedValue([
      { id: 'emp-1', nombre: 'Ana' },
      { id: 'emp-2', nombre: 'Luis' },
    ] as any);

    const result = await updatePersonal('fiesta-target', [
      { empleadoId: 'emp-1', rolId: 'mozo', eventSalary: 1000 },
      { empleadoId: 'emp-2', rolId: 'barra', eventSalary: 1200 },
    ]);

    expect(result.success).toBe(true);
    expect(mockReadAgenda).toHaveBeenCalledTimes(1);
    expect(mockEvaluarAgenda).toHaveBeenCalledTimes(2);
    expect(mockSaveFiesta).toHaveBeenCalledTimes(1);
  });

  it('no vuelve a leer la agenda al editar solamente el sueldo', async () => {
    mockGetFiestaById.mockResolvedValue({
      ...fiestaBase,
      personalAsignado: [{ empleadoId: 'emp-1', rolId: 'mozo', eventSalary: 1000 }],
    });

    const result = await updatePersonal('fiesta-target', [
      { empleadoId: 'emp-1', rolId: 'mozo', eventSalary: 1500 },
    ]);

    expect(result.success).toBe(true);
    expect(mockReadAgenda).not.toHaveBeenCalled();
    expect(mockEvaluarAgenda).not.toHaveBeenCalled();
  });

  it('no guarda si la agenda no se puede leer', async () => {
    mockReadAgenda.mockRejectedValue(new Error('Firebase no disponible'));

    const result = await updatePersonal('fiesta-target', [
      { empleadoId: 'emp-1', rolId: 'mozo', eventSalary: 1000 },
    ]);

    expect(result).toEqual({ success: false, error: 'Firebase no disponible' });
    expect(mockSaveFiesta).not.toHaveBeenCalled();
    expect(mockGoogleSync).not.toHaveBeenCalled();
  });

  it('informa todos los primeros conflictos y no guarda', async () => {
    mockEvaluarAgenda.mockReturnValue({
      mismoDiaNoSolapado: [],
      horarioSinConfirmar: [],
      solapadas: [
        { nombreEvento: 'Boda', horaInicio: '20:00', horaFin: '01:00', solapaHorario: true },
        { nombreEvento: 'XV', horaInicio: '22:00', horaFin: '04:00', solapaHorario: true },
      ],
    });

    const result = await updatePersonal('fiesta-target', [
      { empleadoId: 'emp-1', rolId: 'mozo', eventSalary: 1000 },
    ]);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Boda');
    expect(result.error).toContain('XV');
    expect(mockSaveFiesta).not.toHaveBeenCalled();
  });

  it('conserva un aviso cuando Google rechaza la sincronización sin lanzar error', async () => {
    mockGetFiestaById.mockResolvedValue({
      ...fiestaBase,
      personalAsignado: [{ empleadoId: 'emp-1', rolId: 'mozo', eventSalary: 1000 }],
    });
    mockGoogleSync.mockResolvedValue({ success: false, error: 'Google sin permiso para este evento' });

    const result = await updatePersonal('fiesta-target', [
      { empleadoId: 'emp-1', rolId: 'mozo', eventSalary: 1500 },
    ]);

    expect(result.success).toBe(true);
    expect(result.googleSyncWarning).toBe('Google sin permiso para este evento');
    expect(mockSaveFiesta).toHaveBeenCalledWith(
      expect.objectContaining({ googleSyncWarning: 'Google sin permiso para este evento' }),
    );
  });
});
