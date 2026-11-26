describe('La llegada con ubicación activada y salón sin coordenadas queda sin verificar (Orden 375 B6)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('con llegadaConUbicacion prendido y el salón sin coordenadas (o salones.json fallido), registra igual con ubicacionVerificada: false', async () => {
    let personalGuardado: any = null;

    jest.doMock('@/app/actions/accesos-personal', () => ({
      getAccesoById: jest.fn(async () => ({
        id: 'tok-1',
        fiestaId: 'fiesta-1',
        empleadoId: 'emp-1',
        activo: true,
      })),
    }));
    jest.doMock('@/lib/auth/vigencia-acceso', () => ({
      accesoVencido: jest.fn(() => false),
    }));
    jest.doMock('@/app/actions/fiesta/fiesta.actions', () => ({
      getFiestaById: jest.fn(async () => ({
        id: 'fiesta-1',
        configuracion: { nombreLugar: 'Salón Sin Coordenadas', fechaEvento: '2026-12-10' },
        personalAsignado: [{ empleadoId: 'emp-1', rolId: 'rol-1' }],
      })),
    }));
    jest.doMock('@/app/actions/settings', () => ({
      getAjustesLlegadaPersonal: jest.fn(async () => ({
        llegadaConUbicacion: true,
        radioMetros: 300,
      })),
    }));
    jest.doMock('@/lib/data-service', () => ({
      readData: jest.fn(async () => [
        { id: 'sal-1', nombre: 'Salón Sin Coordenadas' },
      ]),
      writeData: jest.fn(),
    }));
    jest.doMock('@/lib/fiesta/actualizar-fiesta', () => ({
      actualizarFiesta: jest.fn(async (_id: string, mutator: any) => {
        const res = mutator({
          id: 'fiesta-1',
          personalAsignado: [{ empleadoId: 'emp-1', rolId: 'rol-1' }],
        });
        personalGuardado = res.personalAsignado;
        return { success: true, updatedData: res };
      }),
    }));

    const { registrarLlegadaPersonal } = await import('@/app/actions/accesos-personal-view');
    const res = await registrarLlegadaPersonal('tok-1', { lat: -31.38, lng: -57.96 });

    expect(res.success).toBe(true);
    expect(personalGuardado?.[0]?.checkInUbicacion?.ubicacionVerificada).toBe(false);
  });
});
