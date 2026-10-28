jest.mock('server-only', () => ({}));

const mockRecuerdos = new Map<string, any>();

jest.mock('@/lib/data-service', () => ({
  createDataItem: jest.fn(async (_archivo: string, _coleccion: string, id: string, item: any) => {
    mockRecuerdos.set(id, item);
  }),
  deleteDataItem: jest.fn(async (_archivo: string, _coleccion: string, id: string) => mockRecuerdos.delete(id)),
  readDataConDetalle: jest.fn(async () => ({ valor: Array.from(mockRecuerdos.values()), huboFalla: false })),
}));

import { loQueSe, olvidar, recordar } from '@/lib/asistente/memoria';

describe('memoria privada del asistente', () => {
  beforeEach(() => mockRecuerdos.clear());

  it('guarda recuerdos por persona y encuentra los relacionados', async () => {
    await recordar('equipo-1', 'A los Perez no se los llama de manana', 'Familia Perez');
    await recordar('equipo-2', 'La familia Perez prefiere mensajes por la tarde', 'Familia Perez');

    const propios = await loQueSe('equipo-1', 'Perez');
    expect(propios).toHaveLength(1);
    expect(propios[0].texto).toContain('no se los llama');
  });

  it('solo deja al perfil de dueño consultar recuerdos identificados como suyos', async () => {
    await recordar('dueno-1', 'El salon preferido es La Rinconada', 'Salon', { esDueno: true });

    expect(await loQueSe('equipo-1', 'salon')).toHaveLength(0);
    expect(await loQueSe('equipo-1', 'salon', { puedeVerMemoriaDelDueno: true })).toHaveLength(1);
  });

  it.each([
    'Acordate que la contraseña es abc123',
    'Acordate que la tarjeta de crédito 4111 1111 1111 1111 vence pronto',
    'Acordate del diagnóstico de diabetes',
  ])('rechaza datos sensibles en vez de guardarlos: %s', async (texto) => {
    await expect(recordar('equipo-1', texto)).resolves.toEqual({ guardado: false, motivo: 'sensible' });
    expect(mockRecuerdos.size).toBe(0);
  });

  it('olvida solo el recuerdo del usuario que coincide con el tema pedido', async () => {
    await recordar('equipo-1', 'A los Perez no se los llama de manana', 'Familia Perez');
    await recordar('equipo-1', 'El salon abre a las diez', 'Salon');
    await recordar('equipo-2', 'Llamar a la familia Perez por la tarde', 'Familia Perez');

    await expect(olvidar('equipo-1', 'Perez')).resolves.toBe(1);
    expect((await loQueSe('equipo-1', 'salon'))).toHaveLength(1);
    expect((await loQueSe('equipo-2', 'Perez'))).toHaveLength(1);
  });
});
