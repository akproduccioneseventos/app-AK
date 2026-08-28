'use server';

import { parsearEntradaMusica } from '@/lib/musica/bandeja-musica';
import {
  resolverCancionesDeLaBandeja,
  type ResultadoResolucion,
} from '@/lib/musica/resolver-enlaces';

/**
 * Abre los enlaces que pegó el cliente y devuelve las canciones de verdad.
 *
 * La pantalla reconoce sola lo que se pega —eso es instantáneo y no necesita
 * internet—, pero abrir una lista de Spotify o un video de YouTube sí sale a
 * buscar afuera. Por eso va acá, en el servidor, y se dispara cuando el equipo
 * lo pide: no se hace en cada tecla mientras alguien escribe.
 */
export async function resolverBandejaDeMusica(
  texto: string,
): Promise<{ success: true; resultado: ResultadoResolucion } | { success: false; error: string }> {
  try {
    const entrada = (texto || '').slice(0, 20_000);
    const reconocidas = parsearEntradaMusica(entrada);
    if (reconocidas.length === 0) {
      return { success: true, resultado: { canciones: [], noSePudo: [] } };
    }
    const resultado = await resolverCancionesDeLaBandeja(reconocidas);
    return { success: true, resultado };
  } catch (error) {
    console.error('[musica] Error al resolver la bandeja:', error);
    return {
      success: false,
      error: 'No se pudieron abrir los enlaces en este momento. Lo que se pegó no se perdió: probá de nuevo en un rato.',
    };
  }
}
