'use server';

import { getFiestaById, updateFiestaById } from '@/app/actions/fiesta-actual';
import { TriviaGame, PhotoMission } from '@/lib/games/game-engine';
import { requireAppSession } from '@/lib/auth';

export async function saveTriviaGame(fiestaId: string, game: TriviaGame): Promise<boolean> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  if (!fiesta) throw new Error('Fiesta no encontrada');
  
  await updateFiestaById(fiestaId, { triviaGame: game });
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
  
  await updateFiestaById(fiestaId, { photoMissions: missions });
  return true;
}

export async function getPhotoMissions(fiestaId: string): Promise<PhotoMission[] | null> {
  await requireAppSession();
  const fiesta = await getFiestaById(fiestaId);
  return fiesta?.photoMissions || null;
}
