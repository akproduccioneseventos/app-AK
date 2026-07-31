'use server';

import { getFiestaById, updateFiestaById } from '@/app/actions/fiesta-actual';
import { TriviaGame, PhotoMission } from '@/lib/games/game-engine';

export async function saveTriviaGame(fiestaId: string, game: TriviaGame) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) throw new Error('Fiesta no encontrada');
  
  await updateFiestaById(fiestaId, { triviaGame: game });
  return true;
}

export async function getTriviaGame(fiestaId: string): Promise<TriviaGame | null> {
  const fiesta = await getFiestaById(fiestaId);
  return fiesta?.triviaGame || null;
}

export async function savePhotoMissions(fiestaId: string, missions: PhotoMission[]) {
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) throw new Error('Fiesta no encontrada');
  
  await updateFiestaById(fiestaId, { photoMissions: missions });
  return true;
}

export async function getPhotoMissions(fiestaId: string): Promise<PhotoMission[] | null> {
  const fiesta = await getFiestaById(fiestaId);
  return fiesta?.photoMissions || null;
}
