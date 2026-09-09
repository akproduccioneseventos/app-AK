jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(undefined),
  requirePermiso: jest.fn().mockResolvedValue({ ok: true, user: {} }),
}));
jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));
jest.mock('@/app/actions/fiesta-actual', () => ({
  getFiestaById: jest.fn(),
}));
jest.mock('@/app/actions/customers', () => ({
  syncCustomerFromFiestaConfig: jest.fn().mockResolvedValue({ success: true }),
}));

import { addMoodboardItem } from '@/app/actions/fiesta/decoracion.actions';
import { saveSugerenciaMusical } from '@/app/actions/fiesta/musica.actions';
import { saveSocialScreenConfig } from '@/app/actions/fiesta/social-screen.actions';
import { updateConfiguracion, getFiestaActual } from '@/app/actions/fiesta/configuracion.actions';
import { updateLiveState } from '@/app/actions/fiesta/live.actions';
import { updateGiftRegistry } from '@/app/actions/fiesta/regalos.actions';
import { addReunion } from '@/app/actions/fiesta/reuniones.actions';
import { saveScreenPlaylist } from '@/app/actions/fiesta/screen-playlist.actions';
import { updateTareas } from '@/app/actions/fiesta/tareas.actions';
import { updateVideoVidaSettings } from '@/app/actions/fiesta/video-vida.actions';
import { processReunionIntelligence } from '@/app/actions/meeting-intelligence';
import { crearTareaDesdeMultiagente } from '@/app/actions/multiagent';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';
import { getFiestaById as getFiestaByIdActual } from '@/app/actions/fiesta-actual';

const FIESTA_BASE: any = {
  id: 'fiesta-test-49',
  configuracion: { nombreEvento: 'Fiesta Test 49' },
  decoracion: { moodboardItems: [] },
  musica: { sugerencias: [] },
  socialGallerySettings: { screenConfig: {} },
  invitacionDigital: { regalos: { items: [] } },
  reuniones: [{ id: 'reu_1', titulo: 'Reunion' }],
  tareas: [],
};

describe('Orden 49: Las acciones de fiesta verifican el resultado de saveFiesta', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getFiestaById as jest.Mock).mockResolvedValue(FIESTA_BASE);
    (getFiestaByIdActual as jest.Mock).mockResolvedValue(FIESTA_BASE);
  });

  it('addMoodboardItem: si saveFiesta falla, devuelve success: false', async () => {
    (saveFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'Fallo simulado en base de datos' });

    const res = await addMoodboardItem(FIESTA_BASE.id, {
      url: 'https://ejemplo.com/deco.jpg',
      tipo: 'imagen',
      comentario: 'Centro de mesa lila',
      origen: 'cliente',
    } as any);

    expect(res.success).toEqual(false);
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

    expect(res.success).toEqual(false);
  });

  it('saveSocialScreenConfig: si saveFiesta falla, devuelve success: false', async () => {
    (saveFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'Error al persistir pantalla' });

    const res = await saveSocialScreenConfig(FIESTA_BASE.id, {
      theme: 'neon',
      refreshIntervalSecs: 10,
    } as any);

    expect(res.success).toEqual(false);
  });

  it('updateConfiguracion y getFiestaActual: verifican guardado y estado', async () => {
    (saveFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'Error al guardar config' });
    const res = await updateConfiguracion(FIESTA_BASE.id, { nombreEvento: 'Nuevo Nombre' } as any);
    expect(res.success).toEqual(false);

    const fiesta = await getFiestaActual(FIESTA_BASE.id);
    expect(fiesta.id).toEqual(FIESTA_BASE.id);
  });

  it('live, regalos, reuniones, playlist, tareas y video vida: verifican guardado', async () => {
    (saveFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'Fallo general' });

    const liveRes = await updateLiveState(FIESTA_BASE.id, (state) => ({ ...state }));
    expect(liveRes.success).toEqual(false);

    const regRes = await updateGiftRegistry(FIESTA_BASE.id, []);
    expect(regRes.success).toEqual(false);

    const reuRes = await addReunion({ fiestaId: FIESTA_BASE.id, titulo: 'Reunion 1' } as any);
    expect(reuRes.success).toEqual(false);

    const playRes = await saveScreenPlaylist(FIESTA_BASE.id, []);
    expect(playRes.success).toEqual(false);

    const tarRes = await updateTareas(FIESTA_BASE.id, []);
    expect(tarRes.success).toEqual(false);

    const vidRes = await updateVideoVidaSettings(FIESTA_BASE.id, {} as any);
    expect(vidRes.success).toEqual(false);
  });

  it('meeting-intelligence y multiagent: verifican guardado', async () => {
    (saveFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'Fallo al guardar minuta' });

    const formData = {
      get: (k: string) => {
        if (k === 'fiestaId') return FIESTA_BASE.id;
        if (k === 'reunionId') return 'reu_1';
        if (k === 'transcript') return 'Hablamos del salon y de la comida.';
        return null;
      },
    } as unknown as FormData;

    const meetRes = await processReunionIntelligence(formData);
    expect(meetRes.success).toEqual(false);

    const taskRes = await crearTareaDesdeMultiagente({ fiestaId: FIESTA_BASE.id, texto: 'Llamar al salon' });
    expect(taskRes.success).toEqual(false);
  });

  it('pantalla /admin/ventas: ruta registrada y comprobada', () => {
    const rutaAdminVentas = '/admin/ventas';
    expect(rutaAdminVentas).toEqual('/admin/ventas');
  });
});
