import { joinTriviaGame, submitTriviaScore } from '@/app/actions/games.actions';
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

  describe('Trivia por Mesa', () => {
    it('debería asignar a un invitado con mesa a su mesa correspondiente y guardar puntos', async () => {
      (getPublicGuestPortalData as jest.Mock).mockResolvedValue({
        guest: { id: 'g1', nombre: 'Juan', tableNumber: 'Mesa 4' }
      });

      const mockFiesta = {
        id: 'f1',
        triviaGame: { participants: [] }
      };
      (getFiestaById as jest.Mock).mockResolvedValue(mockFiesta);
      
      const joinResult = await joinTriviaGame('f1', 'g1', 'token123', 'Juan');
      expect(joinResult.success).toBe(true);

      expect(guardada).toEqual(expect.objectContaining({
        triviaGame: expect.objectContaining({
          participants: expect.arrayContaining([
            expect.objectContaining({ guestId: 'g1', tableNumber: 'Mesa 4', guestName: 'Juan', score: 0 })
          ])
        })
      }));

      // Submit score
      // El puntaje se suma sobre lo que quedó guardado al unirse.

      const scoreResult = await submitTriviaScore('f1', 'g1', 'token123', 100);
      expect(scoreResult.success).toBe(true);
      expect(guardada).toEqual(expect.objectContaining({
        triviaGame: expect.objectContaining({
          participants: expect.arrayContaining([
            expect.objectContaining({ guestId: 'g1', score: 100 })
          ])
        })
      }));
    });

    it('debería permitir jugar sin errores a un invitado sin mesa (individual)', async () => {
      (getPublicGuestPortalData as jest.Mock).mockResolvedValue({
        guest: { id: 'g2', nombre: 'Ana' } // Sin tableNumber
      });

      const mockFiesta = {
        id: 'f1',
        triviaGame: { participants: [] }
      };
      (getFiestaById as jest.Mock).mockResolvedValue(mockFiesta);
      
      const joinResult = await joinTriviaGame('f1', 'g2', 'token456', 'Ana');
      expect(joinResult.success).toBe(true);

      expect(guardada).toEqual(expect.objectContaining({
        triviaGame: expect.objectContaining({
          participants: expect.arrayContaining([
            expect.objectContaining({ guestId: 'g2', guestName: 'Ana', score: 0 })
          ])
        })
      }));
    });
  });

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

    it('la trivia no deja entrar con una credencial que no vale', async () => {
      (getPublicGuestPortalData as jest.Mock).mockResolvedValue(null);
      (getFiestaById as jest.Mock).mockResolvedValue({ id: 'f1' });
      const r = await joinTriviaGame('f1', 'g9', 'falsa', 'Intruso');
      expect(r.success).toBe(false);
      expect(guardada).toBeNull();
    });
  });
});
