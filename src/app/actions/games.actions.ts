'use server';

import { getFiestaById, saveFiesta } from '@/app/actions/fiesta-actual';
import { TriviaGame, PhotoMission, TriviaParticipant } from '@/lib/games/game-engine';
import { requireAppSession } from '@/lib/auth/require-session';
import { getPublicGuestPortalData } from '@/app/actions/public-guest-portal';

/**
 * No existe un \updateFiestaById\ parcial: la fiesta se guarda entera con
 * \saveFiesta\, asi que se parte de la fiesta ya leida y se reemplaza solo el
 * campo correspondiente.
 */
export async function saveTriviaGame(fiestaId: string, game: TriviaGame): Promise<boolean> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return false;

  const result = await saveFiesta({
    ...fiesta,
    triviaGame: game,
  });
  return result.success;
}

export async function getTriviaGame(fiestaId: string): Promise<TriviaGame | null> {
  const fiesta = await getFiestaById(fiestaId);
  return fiesta?.triviaGame || null;
}

export async function savePhotoMissions(fiestaId: string, missions: PhotoMission[]): Promise<boolean> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) return false;

  const result = await saveFiesta({
    ...fiesta,
    photoMissions: missions,
  });
  return result.success;
}

export async function getPhotoMissions(fiestaId: string): Promise<PhotoMission[] | null> {
  const fiesta = await getFiestaById(fiestaId);
  return fiesta?.photoMissions || null;
}

/**
 * Guest Public Actions
 */
export async function joinTriviaGame(
  fiestaId: string,
  guestId: string,
  guestAccessToken: string,
  guestName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const portal = await getPublicGuestPortalData(fiestaId, guestId, guestAccessToken);
    const tableNumber = portal?.guest?.tableNumber;
    const realName = portal?.guest?.nombre || guestName;

    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada' };

    const triviaGame = fiesta.triviaGame || { questions: [], participants: [] };
    const participants = triviaGame.participants || [];
    const existingIndex = participants.findIndex(p => p.guestId === guestId);
    
    if (existingIndex >= 0) {
      participants[existingIndex] = {
        ...participants[existingIndex],
        guestName: realName,
        tableNumber: tableNumber || participants[existingIndex].tableNumber,
      };
    } else {
      participants.push({
        guestId,
        guestName: realName,
        tableNumber: tableNumber,
        score: 0,
      });
    }

    const result = await saveFiesta({
      ...fiesta,
      triviaGame: { ...triviaGame, participants }
    });

    if (!result?.success) return { success: false, error: 'No se pudo registrar la participación' };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al procesar la entrada' };
  }
}

export async function submitTriviaScore(
  fiestaId: string,
  guestId: string,
  guestAccessToken: string,
  scoreToAdd: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const portal = await getPublicGuestPortalData(fiestaId, guestId, guestAccessToken);
    if (!portal) return { success: false, error: 'Credenciales inválidas' };

    const fiesta = await getFiestaById(fiestaId);
    if (!fiesta) return { success: false, error: 'Fiesta no encontrada' };

    const triviaGame = fiesta.triviaGame;
    if (!triviaGame) return { success: false, error: 'Juego no encontrado' };

    const participants = triviaGame.participants || [];
    const existingIndex = participants.findIndex(p => p.guestId === guestId);

    if (existingIndex >= 0) {
      participants[existingIndex] = {
        ...participants[existingIndex],
        score: (participants[existingIndex].score || 0) + scoreToAdd,
      };
      
      await saveFiesta({
        ...fiesta,
        triviaGame: { ...triviaGame, participants }
      });
    }
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al procesar el puntaje' };
  }
}
