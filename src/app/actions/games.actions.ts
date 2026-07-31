'use server';

import { getFiestaById, saveFiesta } from '@/app/actions/fiesta-actual';
import { TriviaGame, PhotoMission } from '@/lib/games/game-engine';
import { requireAppSession } from '@/lib/auth/require-session';

/**
 * No existe un `updateFiestaById` parcial: la fiesta se guarda entera con
 * `saveFiesta`, asi que se parte de la fiesta ya leida y se reemplaza solo el
 * campo correspondiente.
 */
export async function saveTriviaGame(fiestaId: string, game: TriviaGame): Promise<boolean> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) throw new Error('Fiesta no encontrada');

  const result = await saveFiesta({ ...fiesta, triviaGame: game });
  if (!result?.success) throw new Error(result?.error || 'No se pudo guardar el juego.');
  return true;
}

export async function getTriviaGame(fiestaId: string): Promise<TriviaGame | null> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  return fiesta?.triviaGame || null;
}

export async function savePhotoMissions(fiestaId: string, missions: PhotoMission[]): Promise<boolean> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) throw new Error('Fiesta no encontrada');

  const result = await saveFiesta({ ...fiesta, photoMissions: missions });
  if (!result?.success) throw new Error(result?.error || 'No se pudieron guardar las misiones.');
  return true;
}

export async function getPhotoMissions(fiestaId: string): Promise<PhotoMission[] | null> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  return fiesta?.photoMissions || null;
}
