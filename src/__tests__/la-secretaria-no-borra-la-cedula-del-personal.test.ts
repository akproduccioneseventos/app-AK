/** @jest-environment node */

/**
 * 21/10/2026, barrido de la pregunta 22 tras la orden 204. `saveEmpleado` leía la lista con
 * `getEmpleados`, que a quien no tiene SUELDOS le devuelve la cédula y la fecha de nacimiento vacías.
 * La secretaria editaba el teléfono de alguien y, al guardar, la ficha quedaba sin cédula, sin fecha
 * de nacimiento y sin contrato. Además se guardaba la ficha entera leída antes: lo que otro cambió en
 * el medio se perdía.
 */
let sesion: Record<string, unknown> = {};
jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => sesion),
  requirePermiso: jest.fn(async () => ({ ok: true, user: sesion })),
}));
jest.mock('@/lib/firebase/storage', () => ({ uploadToStorage: jest.fn(), deleteFromStorage: jest.fn() }));

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
import { readData } from '@/lib/data-service';

const ficha = {
  id: 'emp_1',
  nombre: 'Ana',
  cedula: '1.234.567-8',
  fechaNacimiento: '1990-05-01',
  telefono: '099111111',
  contractFileName: 'https://storage/contrato.pdf',
  rolIds: ['mozo'],
};

describe('la secretaria no borra la cédula del personal', () => {
  beforeEach(() => {
    guardada = structuredClone(ficha);
  });

  it('cambiar el teléfono conserva cédula, nacimiento y contrato', async () => {
    sesion = { userId: 's1', perfil: 'secretaria', role: 'user' };
    // Lo que manda la pantalla de la secretaria: los datos personales le llegan vacíos.
    const res = await saveEmpleado({ ...ficha, cedula: '', fechaNacimiento: '', contractFileName: undefined, telefono: '099222222' });
    expect(res.success).toBe(true);
    expect(guardada).toMatchObject({ telefono: '099222222', cedula: '1.234.567-8', fechaNacimiento: '1990-05-01', contractFileName: 'https://storage/contrato.pdf' });
    // Y la respuesta tampoco le muestra lo personal.
    expect(res.empleado?.cedula).toBe('');
  });

  it('el dueño sí puede cambiar la cédula', async () => {
    sesion = { userId: 'd1', perfil: 'dueno', role: 'admin' };
    await saveEmpleado({ ...ficha, cedula: '9.999.999-9' });
    expect(guardada).toMatchObject({ cedula: '9.999.999-9' });
  });

  it('se guarda sobre la ficha actual: lo que otro cambió en el medio no se pierde', async () => {
    sesion = { userId: 'd1', perfil: 'dueno', role: 'admin' };
    const vieja = structuredClone(ficha);
    (readData as jest.Mock).mockImplementationOnce(async () => [vieja]);
    guardada = { ...structuredClone(ficha), photoUrl: 'https://storage/foto-nueva.jpg' };
    await saveEmpleado({ id: 'emp_1', nombre: 'Ana', telefono: '099333333' } as never);
    expect(guardada).toMatchObject({ telefono: '099333333', photoUrl: 'https://storage/foto-nueva.jpg' });
  });
});
