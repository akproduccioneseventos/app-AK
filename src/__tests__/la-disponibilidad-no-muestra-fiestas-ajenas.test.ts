/** @jest-environment node */

describe('La disponibilidad de decoración no muestra fiestas ajenas (Orden 376 B3)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('una sesión sin permiso no recibe fiestaId ni nombres de otras fiestas', async () => {
    jest.doMock('@/lib/auth/require-session', () => ({
      requireAppSession: jest.fn(async () => ({ userId: 'u-vista', perfil: 'staff' })),
      requirePermisoAlguno: jest.fn(async () => {
        throw new Error('Tu perfil no tiene acceso a esta información.');
      }),
    }));
    jest.doMock('@/lib/fiesta/leer-fiestas', () => ({
      leerFiestasCrudas: jest.fn(async () => [
        {
          id: 'fiesta-ajena-secreta',
          configuracion: {
            nombreEvento: 'Casamiento Pérez & Gómez',
            fechaEvento: '2026-12-20',
          },
          decoracion: {
            itemsDecoracion: [{ id: 'd1', nombre: 'Arco floral blanco', cantidad: 1 }],
          },
        },
      ]),
    }));

    const { getDisponibilidadElementosDecoracion } = await import('@/app/actions/fiesta/decoracion.actions');
    const lista = await getDisponibilidadElementosDecoracion('2026-12-20', 'mi-fiesta');

    expect(lista).toHaveLength(1);
    expect(lista[0].nombreItem).toBe('Arco floral blanco');
    expect(lista[0].fiestaNombre).toBe('Otra fiesta');
    expect(lista[0].fiestaId).toBeUndefined();
  });
});
