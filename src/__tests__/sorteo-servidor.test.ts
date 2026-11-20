import { sortearGanadorEnServidor } from '@/app/actions/fiesta/screen-mode.actions';

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn(async () => ({ email: 'admin@ak.com', role: 'admin', userId: 'u1', perfil: 'dueno' })),
  requirePermiso: jest.fn(async () => ({ email: 'admin@ak.com', role: 'admin', userId: 'u1', perfil: 'dueno' })),
}));

let mockFiesta: any = null;
const mockSaveFiesta = jest.fn(async (fiesta: any) => {
  mockFiesta = fiesta;
  return { success: true };
});

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(async () => mockFiesta),
  getFiestas: jest.fn(async () => []),
  saveFiesta: (fiesta: any) => mockSaveFiesta(fiesta),
}));

jest.mock('@/lib/auth/event-access', () => ({
  requireEventPermission: jest.fn(async () => mockFiesta),
}));

describe('sortearGanadorEnServidor', () => {
  beforeEach(() => {
    mockSaveFiesta.mockClear();
  });

  it('elige un ganador de la lista guardada sin inventar Mesa 1', async () => {
    mockFiesta = {
      id: 'fiesta-sorteo-1',
      socialGallerySettings: {
        enabled: true,
        allowLikes: true,
        allowComments: true,
        uploadsActive: true,
        sorteoCandidatos: ['Ana Pérez', 'Luis Gómez', 'Sofía Silva'],
      },
    };

    const res = await sortearGanadorEnServidor('fiesta-sorteo-1', { premio: 'Botella' });
    expect(res.success).toBe(true);
    expect(['Ana Pérez', 'Luis Gómez', 'Sofía Silva']).toContain(res.winner);
    expect(mockSaveFiesta).toHaveBeenCalledTimes(1);
    expect(mockFiesta.socialGallerySettings.activeSorteoWinner).toBe(res.winner);
  });

  it('devuelve error claro si no hay participantes cargados', async () => {
    mockFiesta = {
      id: 'fiesta-sorteo-2',
      socialGallerySettings: {
        enabled: true,
        allowLikes: true,
        allowComments: true,
        uploadsActive: true,
        sorteoCandidatos: [],
      },
    };

    const res = await sortearGanadorEnServidor('fiesta-sorteo-2');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/participantes/i);
    expect(res.winner).toBeUndefined();
    expect(mockSaveFiesta).not.toHaveBeenCalled();
  });
});
