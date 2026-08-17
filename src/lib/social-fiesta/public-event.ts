import type { FiestaEnPlanificacion } from '@/types/fiesta';

export type PublicSocialEvent = Pick<
  FiestaEnPlanificacion,
  | 'id'
  | 'socialGallerySettings'
  | 'modulosContratados'
  | 'zonaDigitalAdolescentes'
  | 'buzonConfig'
  | 'galeriaUrl'
  | 'momentoPaparazziActivo'
> & {
  configuracion: Pick<FiestaEnPlanificacion['configuracion'], 'nombreEvento' | 'fechaEvento'>;
  clientAccessGranted: boolean;
};

import { calculateLeaderboard } from '@/lib/games/game-engine';

export function toPublicSocialEvent(
  fiesta: FiestaEnPlanificacion,
  clientAccessGranted = false,
): PublicSocialEvent {
  const settings = { ...fiesta.socialGallerySettings };
  if (settings.activeGame?.type === 'trivia' && fiesta.triviaGame) {
    settings.activeGame = {
      ...settings.activeGame,
      tableLeaderboard: calculateLeaderboard(fiesta.triviaGame.participants || []).tableLeaderboard
    };
  }

  return {
    id: fiesta.id,
    configuracion: {
      nombreEvento: fiesta.configuracion.nombreEvento,
      fechaEvento: fiesta.configuracion.fechaEvento,
    },
    socialGallerySettings: settings,
    modulosContratados: fiesta.modulosContratados,
    zonaDigitalAdolescentes: fiesta.zonaDigitalAdolescentes,
    buzonConfig: fiesta.buzonConfig,
    galeriaUrl: fiesta.galeriaUrl,
    momentoPaparazziActivo: fiesta.momentoPaparazziActivo,
    clientAccessGranted,
  };
}
