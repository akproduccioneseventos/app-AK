import { joinTriviaGame, submitTriviaScore } from '@/app/actions/games.actions';
import { addFotoEnVivo } from '@/app/actions/evento-en-vivo';
import { getPublicGuestPortalData } from '@/app/actions/public-guest-portal';
import { getFiestaById, saveFiesta } from '@/app/actions/fiesta/fiesta.actions';

jest.mock('@/app/actions/public-guest-portal', () => ({
  getPublicGuestPortalData: jest.fn(),
}));

jest.mock('@/app/actions/fiesta/fiesta.actions', () => ({
  getFiestaById: jest.fn(),
  saveFiesta: jest.fn(),
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
      (saveFiesta as jest.Mock).mockResolvedValue({ success: true });

      const joinResult = await joinTriviaGame('f1', 'g1', 'token123', 'Juan');
      expect(joinResult.success).toBe(true);

      expect(saveFiesta).toHaveBeenCalledWith(expect.objectContaining({
        triviaGame: expect.objectContaining({
          participants: expect.arrayContaining([
            expect.objectContaining({ guestId: 'g1', tableNumber: 'Mesa 4', guestName: 'Juan', score: 0 })
          ])
        })
      }));

      // Submit score
      mockFiesta.triviaGame.participants = [{ guestId: 'g1', tableNumber: 'Mesa 4', guestName: 'Juan', score: 0 }] as any;
      
      const scoreResult = await submitTriviaScore('f1', 'g1', 'token123', 100);
      expect(scoreResult.success).toBe(true);
      expect(saveFiesta).toHaveBeenCalledWith(expect.objectContaining({
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
      (saveFiesta as jest.Mock).mockResolvedValue({ success: true });

      const joinResult = await joinTriviaGame('f1', 'g2', 'token456', 'Ana');
      expect(joinResult.success).toBe(true);

      expect(saveFiesta).toHaveBeenCalledWith(expect.objectContaining({
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
      (saveFiesta as jest.Mock).mockResolvedValue({ success: true });

      // Simulate form submission sending empty string or 'Invitado' because UI was disabled
      const result = await addFotoEnVivo('f1', { url: 'foto.jpg', autor: 'Invitado' }, 'g1', 'token123');
      expect(result.success).toBe(true);

      expect(saveFiesta).toHaveBeenCalledWith(expect.objectContaining({
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
      (saveFiesta as jest.Mock).mockResolvedValue({ success: true });

      const result = await addFotoEnVivo('f1', { url: 'foto2.jpg', autor: 'Matias (QR)' });
      expect(result.success).toBe(true);

      expect(getPublicGuestPortalData).not.toHaveBeenCalled();
      
      expect(saveFiesta).toHaveBeenCalledWith(expect.objectContaining({
        eventoEnVivo: expect.objectContaining({
          fotos: expect.arrayContaining([
            expect.objectContaining({ autor: 'Matias (QR)', url: 'foto2.jpg' })
          ])
        })
      }));
    });
  });
});
