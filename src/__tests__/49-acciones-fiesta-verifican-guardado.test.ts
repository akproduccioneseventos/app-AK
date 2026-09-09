jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: {} }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));

import { addMoodboardItem } from '@/app/actions/fiesta/decoracion.actions';
import { saveSugerenciaMusical } from '@/app/actions/fiesta/musica.actions';
import { saveSocialScreenConfig } from '@/app/actions/fiesta/social-screen.actions';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';

const FIESTA_BASE: any = {
  id: 'fiesta-test-49',
  configuracion: { nombreEvento: 'Fiesta Test 49' },
  decoracion: { moodboardItems: [] },
  musica: { sugerencias: [] },
  socialGallerySettings: { screenConfig: {} },
};

describe('Orden 49: Las acciones de fiesta verifican el resultado de saveFiesta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getFiestaById as jest.Mock).mockResolvedValue(FIESTA_BASE);
  });

  it('addMoodboardItem: si saveFiesta falla, devuelve success: false', async () => {
    (saveFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'Fallo simulado en base de datos' });

    const res = await addMoodboardItem(FIESTA_BASE.id, {
      url: 'https://ejemplo.com/deco.jpg',
      tipo: 'imagen',
      comentario: 'Centro de mesa lila',
      origen: 'cliente',
    } as any);

    expect(res.success).toBe(false);
    expect(res.error).toMatch(/fallo simulado|no se pudo guardar/i);
  });

  it('saveSugerenciaMusical: si saveFiesta falla, devuelve success: false', async () => {
    (saveFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'Error de disco' });

    const res = await saveSugerenciaMusical(FIESTA_BASE.id, {
      id: 'sug-1',
      tema: 'A Thousand Years',
      artista: 'Christina Perri',
      momentoSugerido: 'Vals',
    } as any);

    expect(res.success).toBe(false);
  });

  it('saveSocialScreenConfig: si saveFiesta falla, devuelve success: false', async () => {
    (saveFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'Error al persistir pantalla' });

    const res = await saveSocialScreenConfig(FIESTA_BASE.id, {
      theme: 'neon',
      refreshIntervalSecs: 10,
    } as any);

    expect(res.success).toBe(false);
  });
});
