import { mutarDecoracion } from '@/app/actions/fiesta/decoracion.actions';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

let dbFiesta: any = {
  id: 'f-deco-1',
  decoracion: {
    estiloDecoracion: 'elegante',
    salonElements: [{ id: 'm1', name: 'Mesa 1', x: 10, y: 10 }],
    moodboardItems: [],
  },
};

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ user: { id: 'admin', perfil: 'admin' } })),
}));
jest.mock('@/lib/auth/equipo-de-la-fiesta', () => ({
  usuarioDelEquipo: jest.fn(async () => null),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_fiestaId: string, mutator: any) => {
    const copiaFresca = clone(dbFiesta);
    const next = mutator(copiaFresca);
    dbFiesta = clone(next);
    return { success: true, updatedData: clone(dbFiesta.decoracion) };
  }),
}));

describe('La decoración no se pisa entre el cliente y el equipo (Orden 375 B4)', () => {
  it('el cliente agrega una foto al moodboard y luego el equipo guarda el plano viejo sin borrar la foto', async () => {
    // 1. El equipo abrió la pantalla cuando moodboardItems estaba vacío:
    const copiaViejaDelPlano = clone(dbFiesta.decoracion.salonElements);
    copiaViejaDelPlano[0].x = 120;

    // 2. El cliente sube una foto al moodboard usando mutación atómica:
    const subaCliente = await mutarDecoracion('f-deco-1', {
      moodboardAdd: {
        id: 'mood-cliente-1',
        url: 'https://cdn.test/centro-flores.jpg',
        uploadedBy: 'Cliente',
        likedByClient: true,
        timestamp: '2026-11-26T18:00:00Z',
      },
    });
    expect(subaCliente.success).toBe(true);

    // 3. El equipo guarda sólo el plano (`salonElements`) con su pantalla abierta antes de la foto:
    const guardoPlano = await mutarDecoracion('f-deco-1', {
      salonElements: copiaViejaDelPlano,
    });
    expect(guardoPlano.success).toBe(true);

    // 4. Ambos cambios persisten sin pisarse:
    expect(dbFiesta.decoracion.salonElements[0].x).toBe(120);
    expect(dbFiesta.decoracion.moodboardItems).toHaveLength(1);
    expect(dbFiesta.decoracion.moodboardItems[0].id).toBe('mood-cliente-1');
  });
});
