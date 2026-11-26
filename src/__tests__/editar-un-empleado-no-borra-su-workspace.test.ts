/** @jest-environment node */

let sesion: Record<string, unknown> = {};
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => sesion),
  requirePermiso: jest.fn(async () => ({ ok: true, user: sesion })),
}));
jest.mock('@/lib/firebase/storage', () => ({
  uploadToStorage: jest.fn(),
  deleteFromStorage: jest.fn(),
}));

let guardada: Record<string, unknown>;
jest.mock('@/lib/data-service', () => ({
  readData: jest.fn(async () => [structuredClone(guardada)]),
  createDataItem: jest.fn(),
  deleteDataItem: jest.fn(),
  mutateDataItem: jest.fn(async (_f: string, _c: string, _id: string, cambiar: (a: unknown) => unknown) => {
    const nuevo = cambiar(structuredClone(guardada));
    if (nuevo) guardada = structuredClone(nuevo) as Record<string, unknown>;
    return nuevo;
  }),
}));

import { saveEmpleado } from '@/app/actions/empleados';

const FICHA_INICIAL = {
  id: 'emp_workspace_1',
  nombre: 'Ana García',
  cedula: '1.234.567-8',
  fechaNacimiento: '1992-03-15T00:00:00.000Z',
  telefono: '099111111',
  email: 'ana@personal.test',
  googleWorkspaceEmail: 'ana@akproducciones.uy',
  googleCalendarId: 'cal-ana-uy-001',
  portalNotas: 'Mozo principal salón norte',
  rolIds: ['mozo'],
  contractFileName: 'https://storage.googleapis.com/demo/contrato-ana.pdf',
  photoUrl: 'https://storage.googleapis.com/demo/foto-ana.jpg',
};

describe('Orden 368 B3: editar un empleado desde FormData no borra su workspace ni campos omitidos', () => {
  beforeEach(() => {
    sesion = { userId: 'dueno-1', perfil: 'dueno', role: 'admin' };
    guardada = structuredClone(FICHA_INICIAL);
  });

  it('conserva googleWorkspaceEmail, googleCalendarId, portalNotas y opcionales cuando el FormData no los envía', async () => {
    const formData = new FormData();
    formData.append('id', 'emp_workspace_1');
    formData.append('nombre', 'Ana García Editada');
    formData.append('telefono', '099888777');
    formData.append('email', 'ana.nueva@personal.test');
    formData.append('rolIds', 'mozo,barra');

    const res = await saveEmpleado(formData);

    expect(res.success).toBe(true);
    expect(guardada).toMatchObject({
      id: 'emp_workspace_1',
      nombre: 'Ana García Editada',
      telefono: '099888777',
      email: 'ana.nueva@personal.test',
      rolIds: ['mozo', 'barra'],
      googleWorkspaceEmail: 'ana@akproducciones.uy',
      googleCalendarId: 'cal-ana-uy-001',
      portalNotas: 'Mozo principal salón norte',
      fechaNacimiento: '1992-03-15T00:00:00.000Z',
      contractFileName: 'https://storage.googleapis.com/demo/contrato-ana.pdf',
      photoUrl: 'https://storage.googleapis.com/demo/foto-ana.jpg',
    });
  });

  it('actualiza un campo opcional cuando sí viene en FormData y mantiene los demás omitidos', async () => {
    const formData = new FormData();
    formData.append('id', 'emp_workspace_1');
    formData.append('nombre', 'Ana García');
    formData.append('googleWorkspaceEmail', 'ana.workspace@akproducciones.uy');

    const res = await saveEmpleado(formData);

    expect(res.success).toBe(true);
    expect(guardada).toMatchObject({
      googleWorkspaceEmail: 'ana.workspace@akproducciones.uy',
      googleCalendarId: 'cal-ana-uy-001',
      portalNotas: 'Mozo principal salón norte',
      cedula: '1.234.567-8',
    });
  });
});
