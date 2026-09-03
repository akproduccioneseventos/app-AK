import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { calculateLeaderboard } from '@/lib/games/game-engine';

export type PublicSocialEvent = Pick<
  FiestaEnPlanificacion,
  | 'id'
  | 'socialGallerySettings'
  | 'modulosContratados'
  | 'zonaDigitalAdolescentes'
  | 'buzonConfig'
  | 'galeriaUrl'
  | 'momentoPaparazziActivo'
  | 'programa'
  | 'carasIndexadas'
> & {
  configuracion: Pick<FiestaEnPlanificacion['configuracion'], 'nombreEvento' | 'fechaEvento'>;
  clientAccessGranted: boolean;
  cancionUrl?: string;
};

export function toPublicSocialEvent(
  fiesta: FiestaEnPlanificacion,
  clientAccessGranted = false,
): PublicSocialEvent {
  // El podio por mesa se calcula al vuelo desde los participantes. Se tipa igual
  // que el original: esparcirlo suelto hacia que 'enabled' pudiera quedar sin
  // valor y la pantalla del muro no compilaba.
  const settings: FiestaEnPlanificacion['socialGallerySettings'] = fiesta.socialGallerySettings
    && fiesta.socialGallerySettings.activeGame?.type === 'trivia'
    && fiesta.triviaGame
    ? {
        ...fiesta.socialGallerySettings,
        activeGame: {
          ...fiesta.socialGallerySettings.activeGame,
          tableLeaderboard: calculateLeaderboard(fiesta.triviaGame.participants || []).tableLeaderboard,
        },
      }
    : fiesta.socialGallerySettings;

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
    programa: fiesta.programa,
    clientAccessGranted,
    cancionUrl:
      (fiesta as any).cancionUrl ||
      (fiesta as any).musicaFondoUrl ||
      fiesta.invitacionConfig?.musicaFondoUrl ||
      fiesta.invitacionDigital?.musicaFondoUrl ||
      (fiesta.socialGallerySettings as any)?.cancionUrl ||
      (fiesta.socialGallerySettings as any)?.musicaFondoUrl ||
      undefined,
    carasIndexadas:
      fiesta.socialGallerySettings?.modoCaras === 'apagado'
        ? []
        : (fiesta.socialGallerySettings?.carasPreparadas || fiesta.carasIndexadas?.length ? fiesta.carasIndexadas : undefined),
  };
}
