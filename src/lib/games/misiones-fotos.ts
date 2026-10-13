import { actualizarFiesta } from '@/lib/fiesta/actualizar-fiesta';
import {
  idDeMisionDelTag,
  misionesDeLaFiesta,
  resolverJugador,
  type QuienJuega,
} from '@/lib/games/juegos-en-vivo';

/**
 * MISIONES DE FOTOS CON PUNTOS DE VERDAD (13 de octubre de 2026, como las apps de búsqueda de fotos).
 *
 * Cuando una foto subida lleva `momentTag` = `mision:<id>` y se guardó bien, se suman los puntos de
 * esa misión UNA vez por jugador y misión. Si la foto queda esperando aprobación igual cuenta: el
 * invitado ya hizo la misión. Una misión que no existe en la lista de la fiesta (o la de por defecto)
 * no suma. El jugador se comprueba contra la fiesta: enlace personal válido, o id de teléfono.
 */
export async function sumarMisionDeFoto(
  fiestaId: string,
  momentTag: string | undefined | null,
  quien: QuienJuega,
): Promise<{ sumo: boolean; puntos?: number }> {
  const misionId = idDeMisionDelTag(momentTag);
  if (!misionId) return { sumo: false };
  let sumo = false;
  let puntos = 0;
  const guardado = await actualizarFiesta(fiestaId, (fresca) => {
    sumo = false;
    const mision = misionesDeLaFiesta(fresca).find((m) => m.id === misionId);
    if (!mision) return fresca;
    const jugador = resolverJugador(fresca, quien);
    if (!jugador) return fresca;
    const previo = fresca.misionesFotos?.[jugador.clave];
    if (previo?.misiones?.includes(mision.id)) return fresca;
    sumo = true;
    puntos = mision.points;
    return {
      ...fresca,
      misionesFotos: {
        ...(fresca.misionesFotos || {}),
        [jugador.clave]: {
          nombre: jugador.nombre,
          misiones: [...(previo?.misiones || []), mision.id],
          puntos: (previo?.puntos || 0) + mision.points,
        },
      },
    };
  }, { publicRsvp: true });
  if (!guardado.success) throw new Error(guardado.error || 'No se pudieron guardar los puntos de la misión.');
  return { sumo, puntos };
}
