import { addFotoEnVivo, addSolicitudCancion, addMensajeEnVivo } from '@/app/actions/evento-en-vivo';
import { getPublicGuestPortalData } from '@/app/actions/public-guest-portal';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';

jest.mock('@/app/actions/public-guest-portal', () => ({
  getPublicGuestPortalData: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
}));

// Como la de verdad: sin `publicRsvp` exige permiso de escritura de la fiesta, que el invitado no
// tiene. Antes la prueba reemplazaba `saveFiesta` por uno que siempre decía que sí, y por eso
// nunca vio que al invitado se le rechazaba todo (Codex, auditoría 83).
let guardada: any = null;
jest.mock('@/lib/fiesta/actualizar-fiesta', () => ({
  actualizarFiesta: jest.fn(async (_id: string, cambiar: (f: any) => any, opciones: any = {}) => {
    if (!opciones.publicRsvp) return { success: false, error: 'No autorizado para modificar este evento.' };
    const { getFiestaById } = jest.requireMock('@/app/actions/fiesta/fiesta.actions');
    const base = guardada ?? (await getFiestaById());
    guardada = await cambiar(JSON.parse(JSON.stringify(base)));
    return { success: true, updatedFiesta: guardada };
  }),
}));

jest.mock('@/lib/commercial/public-rate-limit', () => ({
  enforcePublicRateLimit: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/lib/auth/require-session', () => ({
  requireAppSession: jest.fn().mockResolvedValue(true),
}));

describe('Bloque A: Identidad del Invitado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    guardada = null;
    (saveFiesta as jest.Mock).mockResolvedValue({ success: false, error: 'No autorizado para modificar este evento.' });
  });

  // La trivia (mesa, puntos, una respuesta por pregunta) se prueba en
  // src/__tests__/trivia-en-vivo-y-misiones-con-puntos.test.ts.

  describe('Muro Social por Nombre', () => {
    it('debería inyectar el nombre real del invitado al subir foto con enlace personal', async () => {
      (getPublicGuestPortalData as jest.Mock).mockResolvedValue({
        guest: { id: 'g1', nombre: 'Carlos G' }
      });

      const mockFiesta = {
        id: 'f1',
        eventoEnVivo: { fotos: [] }
      };
      (getFiestaById as jest.Mock).mockResolvedValue(mockFiesta);
      
      // Simulate form submission sending empty string or 'Invitado' because UI was disabled
      const result = await addFotoEnVivo('f1', { url: 'foto.jpg', autor: 'Invitado' }, 'g1', 'token123');
      expect(result.success).toBe(true);

      expect(guardada).toEqual(expect.objectContaining({
        eventoEnVivo: expect.objectContaining({
          fotos: expect.arrayContaining([
            expect.objectContaining({ autor: 'Carlos G', url: 'foto.jpg' })
          ])
        })
      }));
    });

    it('debería subir foto normalmente usando el nombre ingresado si viene de QR general', async () => {
      // Sin guestId
      const mockFiesta = {
        id: 'f1',
        eventoEnVivo: { fotos: [] }
      };
      (getFiestaById as jest.Mock).mockResolvedValue(mockFiesta);
      
      const result = await addFotoEnVivo('f1', { url: 'foto2.jpg', autor: 'Matias (QR)' });
      expect(result.success).toBe(true);

      expect(getPublicGuestPortalData).not.toHaveBeenCalled();
      
      expect(guardada).toEqual(expect.objectContaining({
        eventoEnVivo: expect.objectContaining({
          fotos: expect.arrayContaining([
            expect.objectContaining({ autor: 'Matias (QR)', url: 'foto2.jpg' })
          ])
        })
      }));
    });
  });

  describe('Barrido ENT83-GUEST: lo que manda el invitado en vivo se guarda', () => {
    it('canción y mensaje quedan guardados sin sesión del equipo', async () => {
      (getFiestaById as jest.Mock).mockResolvedValue({ id: 'f1', eventoEnVivo: { fotos: [], solicitudesCanciones: [], mensajes: [] } });
      expect((await addSolicitudCancion('f1', { titulo: 'Tema', artista: 'Banda', invitadoNombre: 'Ana' } as any)).success).toBe(true);
      expect((await addMensajeEnVivo('f1', { texto: 'Felicidades', autor: 'Ana' } as any)).success).toBe(true);
      expect(guardada.eventoEnVivo.solicitudesCanciones).toHaveLength(1);
      expect(guardada.eventoEnVivo.mensajes).toHaveLength(1);
    });
  });
});
