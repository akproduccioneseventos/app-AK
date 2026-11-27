const mockFiestas: Record<string, any> = {};
let mockUserPermisos = ['organizacion'];

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ user: { id: 'u1', perfil: 'organizador' } })),
  requirePermiso: jest.fn(async () => ({ ok: true, user: { id: 'u1', perfil: 'organizador', permisos: mockUserPermisos } })),
}));
jest.mock('@/lib/auth/perfiles', () => ({
  PERMISOS: { ORGANIZACION: 'organizacion', SUELDOS: 'sueldos', GANANCIAS: 'ganancias' },
  puede: jest.fn((user: any, perm: string) => (mockUserPermisos || []).includes(perm)),
}));
jest.mock('../google-workspace', () => ({}), { virtual: true });
jest.mock('@/app/actions/google-workspace', () => ({
  syncFiestaToGoogleWorkspace: jest.fn().mockResolvedValue({ success: true }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async (id: string) => JSON.parse(JSON.stringify(mockFiestas[id]))),
  getFiestas: jest.fn(async () => Object.values(mockFiestas).map((f) => JSON.parse(JSON.stringify(f)))),
  updateFiestaPartial: jest.fn(async () => ({ success: true })),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (id: string, updater: (f: any) => any) => {
    const copia = JSON.parse(JSON.stringify(mockFiestas[id]));
    const siguiente = updater(copia);
    mockFiestas[id] = JSON.parse(JSON.stringify(siguiente));
    return { success: true, updatedFiesta: siguiente };
  }),
}));

import { updatePersonal } from '@/app/actions/fiesta/personal.actions';

describe('Orden 363: guardar el personal no borra las llegadas ni mezcla sueldos por persona+rol', () => {
  beforeEach(() => {
    mockUserPermisos = ['organizacion'];
    mockFiestas['f_pers_363'] = {
      id: 'f_pers_363',
      configuracion: { nombreEvento: 'Boda', fechaEvento: '2026-12-20' },
      personalAsignado: [
        {
          empleadoId: 'emp_ana',
          rolId: 'rol_recepcion',
          eventSalary: 3500,
          checkInTimestamp: '2026-12-20T20:05:00.000Z',
          checkInUbicacion: { lat: -31.38, lng: -57.96 },
          asistenciaConfirmada: true,
          fechaConfirmacionAsistencia: '2026-12-18T10:00:00.000Z',
        },
        {
          empleadoId: 'emp_ana',
          rolId: 'rol_barra',
          eventSalary: 4800,
        },
      ],
    };
  });

  it('conservar llegada y confirmación aunque la pantalla guarde copia vieja, y conserva el sueldo distinto de cada rol sin SUELDOS', async () => {
    const copiaViejaPantalla: any[] = [
      { empleadoId: 'emp_ana', rolId: 'rol_recepcion', eventSalary: 0 },
      { empleadoId: 'emp_ana', rolId: 'rol_barra', eventSalary: 0 },
    ];

    const res = await updatePersonal('f_pers_363', copiaViejaPantalla);
    expect(res.success).toBe(true);

    const guardados = mockFiestas['f_pers_363'].personalAsignado;
    const recep = guardados.find((p: any) => p.rolId === 'rol_recepcion');
    const barra = guardados.find((p: any) => p.rolId === 'rol_barra');
    expect(recep.checkInTimestamp).toBe('2026-12-20T20:05:00.000Z');
    expect(recep.asistenciaConfirmada).toBe(true);
    expect(recep.eventSalary).toBe(3500);
    expect(barra.eventSalary).toBe(4800);
  });
});
