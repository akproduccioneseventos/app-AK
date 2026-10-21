import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { calculateLeaderboard } from '@/lib/games/game-engine';
import { mapProgramaParaElCliente } from '@/lib/client-portal/public-fiesta';
import type { ActiveGameData } from '@/types/fiesta';
import { topTrivia, topCazadores } from '@/lib/games/juegos-en-vivo';

/**
 * La respuesta correcta de la trivia NO sale del servidor hacia los celulares ni la pantalla gigante
 * hasta que el operador la revela (o termina la trivia). Si viajara antes, cualquiera la leería en
 * la respuesta de red y jugaría con ventaja.
 */
export function ocultarRespuestaCorrecta(game: ActiveGameData | undefined): ActiveGameData | undefined {
  if (!game || game.type !== 'trivia') return game;
  if (game.respuestaRevelada || game.isFinished) return game;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { correctOptionId: _oculta, ...sinRespuesta } = game;
  return sinRespuesta;
}

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
  | 'photoMissions'
> & {
  configuracion: Pick<FiestaEnPlanificacion['configuracion'], 'nombreEvento' | 'fechaEvento'>;
  clientAccessGranted: boolean;
  cancionUrl?: string;
  /** Top 5 de la trivia y de las misiones de fotos (nombre corto y puntos; nada más del invitado). */
  rankingJuegos?: {
    trivia: { nombre: string; puntos: number }[];
    cazadores: { nombre: string; puntos: number }[];
  };
  tieneRealidadAumentada?: boolean;
  mindTargetUrl?: string;
};

export function toPublicSocialEvent(
  fiesta: FiestaEnPlanificacion,
  clientAccessGranted = false,
): PublicSocialEvent {
  // El podio por mesa se calcula al vuelo desde los participantes. Se tipa igual
  // que el original: esparcirlo suelto hacia que 'enabled' pudiera quedar sin
  // valor y la pantalla del muro no compilaba.
  const base: FiestaEnPlanificacion['socialGallerySettings'] = fiesta.socialGallerySettings
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
  const settings: FiestaEnPlanificacion['socialGallerySettings'] = base?.activeGame
    ? { ...base, activeGame: ocultarRespuestaCorrecta(base.activeGame) }
    : base;

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
    /**
     * EL ITINERARIO TAMBIEN SE RECORTA ACA, Y ACA IMPORTA MAS.
     *
     * Esto es lo que ve **el invitado** en el muro de la fiesta: cualquiera con el
     * enlace. Mandaba el programa entero, con los momentos internos del equipo y sus
     * notas adentro.
     *
     * Se encontro el 9 de septiembre de 2026 al pasar toda la app con la pregunta
     * nueva -*¿que le manda el servidor al navegador?*- despues del mismo defecto en
     * el portal del cliente. Se usa el mismo recorte, no una copia: dos copias de la
     * misma regla se despegan y la vieja hace dano.
     */
    programa: mapProgramaParaElCliente(fiesta.programa) as FiestaEnPlanificacion['programa'],
    clientAccessGranted,
    photoMissions: fiesta.photoMissions,
    rankingJuegos: { trivia: topTrivia(fiesta), cazadores: topCazadores(fiesta) },
    cancionUrl:
      fiesta.invitacionConfig?.musicaFondoUrl ||
      fiesta.invitacionDigital?.musicaFondoUrl ||
      undefined,
    carasIndexadas:
      fiesta.socialGallerySettings?.modoCaras === 'apagado'
        ? []
        : (fiesta.socialGallerySettings?.carasPreparadas || fiesta.carasIndexadas?.length ? fiesta.carasIndexadas : undefined),
    tieneRealidadAumentada: Boolean(
      (fiesta as any).tieneRealidadAumentada ||
      (fiesta as any).mindTargetUrl ||
      (fiesta as any).invitacionMindUrl ||
      (fiesta as any).invitacionDigital?.arConfig?.enabled ||
      (fiesta as any).invitacionConfig?.arConfig?.enabled
    ),
    mindTargetUrl:
      (fiesta as any).mindTargetUrl ||
      (fiesta as any).invitacionMindUrl ||
      (fiesta as any).invitacionDigital?.arConfig?.mindTargetUrl ||
      (fiesta as any).invitacionConfig?.arConfig?.mindTargetUrl ||
      undefined,
  };
}
