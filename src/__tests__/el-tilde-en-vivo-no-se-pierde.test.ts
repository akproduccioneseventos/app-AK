const mockProgramaStore: Record<string, any> = {};

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue({ user: { id: 'u1', perfil: 'admin' } }),
}));
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (fiestaId: string, updater: (f: any) => any) => {
    const copia = JSON.parse(JSON.stringify(mockProgramaStore[fiestaId]));
    const actualizada = updater(copia);
    mockProgramaStore[fiestaId] = JSON.parse(JSON.stringify(actualizada));
    return { success: true, updatedFiesta: actualizada };
  }),
}));

import { marcarHitoPrograma, updatePrograma } from '@/app/actions/fiesta/itinerario.actions';

describe('Orden 359: el tilde del cronograma en vivo no se pierde al autoguardar', () => {
  beforeEach(() => {
    mockProgramaStore['f_itin_359'] = {
      id: 'f_itin_359',
      programa: [
        { id: 'h1', hora: '21:00', titulo: 'Recepción', completado: false },
        { id: 'h2', hora: '22:00', titulo: 'Cena', completado: false },
      ],
    };
  });

  it('tildar un hito y luego guardar una copia vieja del programa conserva el tilde en vivo', async () => {
    const copiaVieja = [
      { id: 'h1', hora: '21:00', titulo: 'Recepción', completado: false },
      { id: 'h2', hora: '22:00', titulo: 'Cena', completado: false },
    ];

    const marca = await marcarHitoPrograma('f_itin_359', 'h1', true);
    expect(marca.success).toBe(true);

    const guardada = await updatePrograma('f_itin_359', copiaVieja as any);
    expect(guardada.success).toBe(true);
    expect(mockProgramaStore['f_itin_359'].programa.find((p: any) => p.id === 'h1').completado).toBe(true);
  });
});
