/**
 * Bandeja de música unificada para la fiesta (Bloque 14).
 *
 * Convierte cualquier formato de entrada (enlaces de Spotify, videos/playlists de YouTube,
 * o texto pegado de WhatsApp) en canciones estructuradas con título y artista, cruza pedidos
 * de invitados y cliente, agrupa repetidos y organiza los momentos de la fiesta.
 */

export interface CancionBandeja {
  id: string;
  titulo: string;
  artista?: string;
  fuente: 'spotify' | 'youtube' | 'texto_whatsapp' | 'invitado' | 'catalogo_ak';
  urlOriginal?: string;
  momento?: 'entrada' | 'cena' | 'vals' | 'baile' | 'torta' | 'cierre' | 'general';
  pedidoPor?: string;
}

export interface CancionUnificadaFiesta {
  id: string;
  titulo: string;
  artista: string;
  repeticiones: number;
  pedidosPor: string[];
  fuentes: ('spotify' | 'youtube' | 'texto_whatsapp' | 'invitado' | 'catalogo_ak')[];
  enlaceSpotify?: string;
  enlaceYouTube?: string;
  momento: 'entrada' | 'cena' | 'vals' | 'baile' | 'torta' | 'cierre' | 'general';
  esProhibida?: boolean;
  esInfaltable?: boolean;
}

/**
 * Normaliza una cadena de texto para comparar canciones similares.
 */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae título y artista a partir de una línea de texto libre o nombre de video.
 */
export function extraerTituloYArtista(linea: string): { titulo: string; artista: string } {
  let limpia = linea
    .replace(/^(?:https?:\/\/[^\s]+)/i, '')
    .replace(/^\d+[\.\)\-]\s*/, '') // Remueve "1.", "1)", "1-"
    .replace(/\[.*?\]|\(.*?\)/g, ' ') // Remueve "(Official Video)", "[Audio Oficial]"
    .replace(/ft\.|feat\.|featuring/gi, ' ')
    .trim();

  // Si tiene separador " - " o ":"
  if (limpia.includes(' - ')) {
    const partes = limpia.split(' - ');
    const artista = partes[0].trim();
    const titulo = partes.slice(1).join(' - ').trim();
    if (artista && titulo) return { titulo, artista };
  }

  if (limpia.includes(':')) {
    const partes = limpia.split(':');
    const artista = partes[0].trim();
    const titulo = partes.slice(1).join(':').trim();
    if (artista && titulo) return { titulo, artista };
  }

  return {
    titulo: limpia || 'Canción solicitada',
    artista: 'Varios / Por confirmar',
  };
}

/**
 * Parsea cualquier entrada de texto (links de Spotify/YouTube, listas pegadas de WhatsApp, etc.)
 */
export function parsearEntradaMusica(entrada: string, momentoDefault: CancionBandeja['momento'] = 'general'): CancionBandeja[] {
  if (!entrada || !entrada.trim()) return [];

  const lineas = entrada
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const canciones: CancionBandeja[] = [];

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];

    // 1. Detectar Spotify
    if (/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/i.test(linea)) {
      const match = linea.match(/spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/i);
      const tipo = match?.[1]?.toLowerCase() || 'track';
      const id = match?.[2] || `sp_${i}`;

      canciones.push({
        id: `sp_${id}`,
        titulo: tipo === 'playlist' ? 'Playlist de Spotify compartida' : `Pista de Spotify (${id})`,
        artista: 'Spotify',
        fuente: 'spotify',
        urlOriginal: linea,
        momento: momentoDefault,
        pedidoPor: 'Cliente',
      });
      continue;
    }

    // 2. Detectar YouTube
    if (/(?:youtube\.com\/(?:watch\?v=|playlist\?list=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/i.test(linea)) {
      const { titulo, artista } = extraerTituloYArtista(linea);
      canciones.push({
        id: `yt_${i}_${Date.now()}`,
        titulo: titulo.startsWith('http') ? 'Video / Playlist de YouTube' : titulo,
        artista: artista === 'Varios / Por confirmar' ? 'YouTube' : artista,
        fuente: 'youtube',
        urlOriginal: linea,
        momento: momentoDefault,
        pedidoPor: 'Cliente',
      });
      continue;
    }

    // 3. Texto pegado libre (WhatsApp / manual)
    const { titulo, artista } = extraerTituloYArtista(linea);
    if (titulo) {
      canciones.push({
        id: `txt_${i}_${Date.now()}`,
        titulo,
        artista,
        fuente: 'texto_whatsapp',
        momento: momentoDefault,
        pedidoPor: 'Cliente',
      });
    }
  }

  return canciones;
}

/**
 * Unifica las canciones cargadas por el cliente con los pedidos de los invitados de la fiesta.
 * Agrupa temas repetidos y calcula el ranking de popularidad.
 */
export function unificarListaMusica(
  cancionesCliente: CancionBandeja[],
  pedidosInvitados: { cancion: string; invitadoNombre?: string; momento?: CancionBandeja['momento'] }[] = [],
  listaProhibidas: string[] = [],
  listaInfaltables: string[] = []
): CancionUnificadaFiesta[] {
  const mapaUnificado = new Map<string, CancionUnificadaFiesta>();

  const prohibidasNorm = new Set(listaProhibidas.map(normalizarTexto));
  const infaltablesNorm = new Set(listaInfaltables.map(normalizarTexto));

  // Procesar temas del cliente
  for (const c of cancionesCliente) {
    const clave = normalizarTexto(`${c.titulo} ${c.artista || ''}`);
    if (!clave) continue;

    if (mapaUnificado.has(clave)) {
      const existente = mapaUnificado.get(clave)!;
      existente.repeticiones += 1;
      if (c.pedidoPor && !existente.pedidosPor.includes(c.pedidoPor)) {
        existente.pedidosPor.push(c.pedidoPor);
      }
      if (!existente.fuentes.includes(c.fuente)) {
        existente.fuentes.push(c.fuente);
      }
      if (c.urlOriginal?.includes('spotify')) existente.enlaceSpotify = c.urlOriginal;
      if (c.urlOriginal?.includes('youtu')) existente.enlaceYouTube = c.urlOriginal;
    } else {
      mapaUnificado.set(clave, {
        id: c.id,
        titulo: c.titulo,
        artista: c.artista || 'Varios',
        repeticiones: 1,
        pedidosPor: c.pedidoPor ? [c.pedidoPor] : ['Cliente'],
        fuentes: [c.fuente],
        enlaceSpotify: c.urlOriginal?.includes('spotify') ? c.urlOriginal : undefined,
        enlaceYouTube: c.urlOriginal?.includes('youtu') ? c.urlOriginal : undefined,
        momento: c.momento || 'general',
        esProhibida: prohibidasNorm.has(clave) || prohibidasNorm.has(normalizarTexto(c.titulo)),
        esInfaltable: infaltablesNorm.has(clave) || infaltablesNorm.has(normalizarTexto(c.titulo)),
      });
    }
  }

  // Procesar pedidos de invitados
  for (const p of pedidosInvitados) {
    const { titulo, artista } = extraerTituloYArtista(p.cancion);
    const clave = normalizarTexto(`${titulo} ${artista}`);
    if (!clave) continue;

    const nombreQuienPide = p.invitadoNombre || 'Invitado';

    if (mapaUnificado.has(clave)) {
      const existente = mapaUnificado.get(clave)!;
      existente.repeticiones += 1;
      if (!existente.pedidosPor.includes(nombreQuienPide)) {
        existente.pedidosPor.push(nombreQuienPide);
      }
      if (!existente.fuentes.includes('invitado')) {
        existente.fuentes.push('invitado');
      }
    } else {
      mapaUnificado.set(clave, {
        id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        titulo,
        artista,
        repeticiones: 1,
        pedidosPor: [nombreQuienPide],
        fuentes: ['invitado'],
        momento: p.momento || 'baile',
        esProhibida: prohibidasNorm.has(clave) || prohibidasNorm.has(normalizarTexto(titulo)),
        esInfaltable: infaltablesNorm.has(clave) || infaltablesNorm.has(normalizarTexto(titulo)),
      });
    }
  }

  // Ordenar por repeticiones (más pedidas primero)
  return Array.from(mapaUnificado.values()).sort((a, b) => b.repeticiones - a.repeticiones);
}
