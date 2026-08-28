import 'server-only';

import { getSpotifyPlaylistTracks, getSpotifyTrack, isSpotifyConfigured } from '@/lib/spotify';
import type { CancionBandeja } from './bandeja-musica';

/**
 * Abrir los enlaces de verdad, que es lo que faltaba.
 *
 * La bandeja sabe RECONOCER que una linea es un enlace de Spotify o de YouTube,
 * pero no lo abre: guardaba una cancion que decia "Playlist de Spotify
 * compartida", artista "Spotify". El DJ abria la lista y veia eso en vez de los
 * temas. Palabras del dueño: *"muchas veces nos pasan link de YouTube; quiero que
 * todo este conectado, no solo el link."*
 *
 * Esto es la otra mitad: agarra lo que reconocio la bandeja y **va a buscar los
 * titulos reales**.
 *
 * Dos reglas que no se negocian:
 *
 * 1. **Nada inventado.** Lo que no se pudo abrir se devuelve aparte, con el
 *    motivo en criollo, para que alguien lo resuelva a mano. Nunca se pone "algo
 *    parecido" como si fuera lo que pidio el cliente: es su fiesta.
 * 2. **Nada que se pague por mes.** Spotify se lee con la llave que la app ya
 *    tiene. YouTube se lee con `oembed`, que es publico y **no necesita ninguna
 *    llave**.
 */

const YOUTUBE_OEMBED = 'https://www.youtube.com/oembed';
const TIEMPO_LIMITE_MS = 8_000;

export interface CancionResuelta extends CancionBandeja {
  /** Si es `true`, el titulo y el artista salieron del servicio, no de adivinar. */
  resuelta: boolean;
}

export interface NoSePudoResolver {
  entrada: string;
  motivo: string;
}

export interface ResultadoResolucion {
  canciones: CancionResuelta[];
  noSePudo: NoSePudoResolver[];
}

async function pedirConLimite(url: string) {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), TIEMPO_LIMITE_MS);
  try {
    return await fetch(url, { signal: control.signal, cache: 'no-store' });
  } finally {
    clearTimeout(reloj);
  }
}

/**
 * El titulo real de un video de YouTube, sin llave de ningun tipo.
 *
 * `oembed` es la puerta publica de YouTube: se le pasa el enlace y devuelve el
 * titulo del video y el nombre del canal. Alcanza para que el DJ sepa que tema
 * es, que es lo unico que hace falta.
 */
async function resolverVideoDeYoutube(url: string) {
  const pedido = new URL(YOUTUBE_OEMBED);
  pedido.searchParams.set('url', url);
  pedido.searchParams.set('format', 'json');

  const respuesta = await pedirConLimite(pedido.toString());
  if (respuesta.status === 404 || respuesta.status === 401) return null;
  if (!respuesta.ok) throw new Error('YouTube no contesto');

  const datos = await respuesta.json() as { title?: string; author_name?: string };
  if (!datos.title) return null;
  return { titulo: datos.title, artista: datos.author_name || 'YouTube' };
}

function idDeSpotify(url: string) {
  const encontrado = url.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/i);
  if (!encontrado) return null;
  return { tipo: encontrado[1].toLowerCase(), id: encontrado[2] };
}

function esPlaylistDeYoutube(url: string) {
  return /[?&]list=/.test(url) || /youtube\.com\/playlist/i.test(url);
}

/**
 * Toma lo que reconocio la bandeja y devuelve las canciones con nombre y apellido.
 *
 * Una lista de Spotify se abre y se convierte en **todas** sus canciones, no en
 * una sola linea que dice "playlist compartida".
 */
export async function resolverCancionesDeLaBandeja(
  entradas: CancionBandeja[],
): Promise<ResultadoResolucion> {
  const canciones: CancionResuelta[] = [];
  const noSePudo: NoSePudoResolver[] = [];

  for (const entrada of entradas) {
    const url = entrada.urlOriginal || '';

    if (entrada.fuente === 'spotify' && url) {
      if (!isSpotifyConfigured()) {
        noSePudo.push({
          entrada: url,
          motivo: 'Todavia no esta configurada la conexion con Spotify, asi que no se pudo abrir la lista.',
        });
        continue;
      }
      const referencia = idDeSpotify(url);
      if (!referencia) {
        noSePudo.push({ entrada: url, motivo: 'El enlace de Spotify no se entiende.' });
        continue;
      }
      try {
        if (referencia.tipo === 'playlist') {
          const temas = await getSpotifyPlaylistTracks(referencia.id);
          if (temas.length === 0) {
            noSePudo.push({ entrada: url, motivo: 'La lista se abrio pero no tiene canciones adentro.' });
            continue;
          }
          for (const tema of temas) {
            canciones.push({
              ...entrada,
              id: `sp_${tema.id}`,
              titulo: tema.title,
              artista: tema.artist,
              urlOriginal: tema.externalUrl || url,
              resuelta: true,
            });
          }
        } else {
          const tema = await getSpotifyTrack(referencia.id);
          if (!tema) {
            noSePudo.push({ entrada: url, motivo: 'Spotify no encontro esa cancion.' });
            continue;
          }
          canciones.push({
            ...entrada,
            id: `sp_${tema.id}`,
            titulo: tema.title,
            artista: tema.artist,
            urlOriginal: tema.externalUrl || url,
            resuelta: true,
          });
        }
      } catch (error) {
        const esPrivada = error instanceof Error && error.message === 'LISTA_NO_VISIBLE';
        noSePudo.push({
          entrada: url,
          motivo: esPrivada
            ? 'La lista esta en privado y no la podemos ver. Pedile al cliente que la ponga en publica o compartida.'
            : 'Spotify no contesto en este momento. Se puede reintentar.',
        });
      }
      continue;
    }

    if (entrada.fuente === 'youtube' && url) {
      if (esPlaylistDeYoutube(url)) {
        // Una lista de YouTube no se puede leer por la puerta publica: haria
        // falta contratar la clave de Google, y eso se pregunta antes.
        noSePudo.push({
          entrada: url,
          motivo: 'Es una lista de YouTube: se puede abrir el video suelto, pero la lista entera no. Pedile al cliente los temas o el enlace de Spotify.',
        });
        continue;
      }
      try {
        const video = await resolverVideoDeYoutube(url);
        if (!video) {
          noSePudo.push({ entrada: url, motivo: 'El video no existe o es privado.' });
          continue;
        }
        canciones.push({ ...entrada, titulo: video.titulo, artista: video.artista, resuelta: true });
      } catch {
        noSePudo.push({ entrada: url, motivo: 'YouTube no contesto en este momento. Se puede reintentar.' });
      }
      continue;
    }

    // Texto pegado y pedidos de invitados: ya vienen con titulo y artista.
    canciones.push({ ...entrada, resuelta: false });
  }

  return { canciones, noSePudo };
}
