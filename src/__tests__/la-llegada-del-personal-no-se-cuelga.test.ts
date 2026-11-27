import { esLecturaFallida } from '@/lib/marca-de-lectura';

describe('La llegada del personal no se cuelga por permisos ni por error (Orden 374 B3)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('perfil personal marca su propia llegada sin llamar getEmpleados() bloqueado y rechaza ajenos', async () => {
    const actualizarFiesta = jest.fn(async (_id: string, mutator: any) => {
      const actualizado = mutator({
        id: 'fiesta-1',
        personalAsignado: [{ empleadoId: 'emp-1', rolId: 'r1' }],
      });
      return { success: true, updatedData: actualizado };
    });

    jest.doMock('@/lib/auth/require-session', () => ({
      requireAppSession: jest.fn(async () => ({
        userId: 'uid-personal',
        email: 'mozo@ak.uy',
        perfil: 'personal',
      })),
      requireSession: jest.fn(async () => ({
        ok: true,
        user: {
          userId: 'uid-personal',
          email: 'mozo@ak.uy',
          perfil: 'personal',
        },
      })),
    }));
    jest.doMock('@/lib/data-service', () => ({
      readData: jest.fn(async () => [
        { id: 'emp-1', email: 'mozo@ak.uy', nombre: 'Marcos' },
        { id: 'emp-2', email: 'otro@ak.uy', nombre: 'Pedro' },
      ]),
    }));
    jest.doMock('@/app/actions/empleados', () => ({
      getEmpleados: jest.fn(async () => {
        throw new Error('Tu perfil no tiene acceso a los datos del personal.');
      }),
    }));
    jest.doMock('@/lib/fiesta/actualizar-fiesta', () => ({
      actualizarFiesta,
    }));

    const { marcarLlegadaPersonal } = await import('@/app/actions/personal-fiestas');
    const propio = await marcarLlegadaPersonal('fiesta-1', 'emp-1');
    expect(propio.success).toBe(true);
    expect(propio.checkInTimestamp).toBeTruthy();

    const ajeno = await marcarLlegadaPersonal('fiesta-1', 'emp-2');
    expect(ajeno.success).toBe(false);
    expect(ajeno.error).toContain('otra persona');
    expect(esLecturaFallida([])).toBe(false);
  });
});
