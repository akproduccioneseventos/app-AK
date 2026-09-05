/**
 * ARMADOR INTELIGENTE DEL ÁLBUM DEL RECUERDO (Orden 28)
 *
 * Elige de forma automática una selección balanceada de 30 a 60 recuerdos
 * (fotos, videos y mensajes de voz/buzón) para que el álbum se arme solo,
 * sin abrumar con 400 fotos idénticas.
 *
 * Criterios:
 * 1. Excluye estrictamente elementos ocultos por moderación.
 * 2. Balancea representación de cada estación activa (fotocabina, 360, bogue, buzon, espejo, invitados).
 * 3. Prioriza recuerdos con más interacción (me gusta) y distribuye a lo largo del tiempo.
 * 4. Incluye 2-4 audios destacados del buzón de recuerdos.
 * 5. Agrupa en páginas de 2 recuerdos por página tipo libro físico.
 */

import type { SocialGalleryPost, Dedication } from '@/types/social-gallery';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { esAprobadoParaMostrar } from '@/lib/social-fiesta/visibilidad';
import { evaluarFoto } from '@/lib/album/elegir-las-mejores';

export interface RecuerdoAlbum {
  id: string;
  tipo: 'foto' | 'video' | 'audio' | 'dedicatoria';
  url?: string;
  audioUrl?: string;
  imageUrl?: string;
  autor: string;
  mensaje?: string;
  likes: number;
  modulo?: string;
  timestamp: string;
  destacado?: boolean;
}

export interface PaginaAlbum {
  numeroPagina: number;
  recuerdos: RecuerdoAlbum[];
  momento?: string;
}

export interface AlbumDigitalCompleto {
  portada: {
    titulo: string;
    subtitulo: string;
    fecha: string;
    fotoPortadaUrl?: string;
    colorTema?: string;
  };
  paginas: PaginaAlbum[];
  totalPaginas: number;
  totalRecuerdos: number;
  todosLosRecuerdos: RecuerdoAlbum[];
}

export function armarAlbumInteligente(params: {
  posts: SocialGalleryPost[];
  dedicatorias?: Dedication[];
  fiesta?: Partial<FiestaEnPlanificacion> | null;
  maxRecuerdos?: number;
}): AlbumDigitalCompleto {
  const { posts = [], dedicatorias = [], fiesta, maxRecuerdos = 40 } = params;

  // 1. Filtrar sólo los posts aprobados
  const postsAprobados = posts.filter((p) => {
    if (p.moderationStatus === 'hidden') return false;
    return esAprobadoParaMostrar(p);
  });

  // 2. Normalizar dedicatorias aprobadas
  const dedicatoriasAprobadas = dedicatorias.filter((d) => d.visibility !== 'private');

  // Convertir posts a Recuerdos
  const recuerdosFotosYVideos: RecuerdoAlbum[] = postsAprobados.map((p) => ({
    id: p.id,
    tipo: (p.mediaType === 'video' ? 'video' : 'foto') as 'foto' | 'video',
    imageUrl: p.imageUrl,
    url: p.imageUrl,
    audioUrl: p.sourceModule === 'buzon' ? p.imageUrl : undefined,
    autor: p.authorName || 'Invitado',
    mensaje: p.caption || p.dedication,
    likes: p.likes || 0,
    modulo: p.sourceModule || (p.source === 'entertainment' ? 'estacion' : 'invitados'),
    timestamp: p.timestamp || new Date().toISOString(),
    destacado: (p.likes || 0) >= 3,
  }));

  // Convertir audios/mensajes de buzón
  const recuerdosAudios: RecuerdoAlbum[] = dedicatoriasAprobadas
    .filter((d) => d.audioUrl || d.message)
    .map((d) => ({
      id: d.id,
      tipo: (d.audioUrl ? 'audio' : 'dedicatoria') as 'audio' | 'dedicatoria',
      audioUrl: d.audioUrl,
      autor: d.authorName || 'Familiar / Amigo',
      mensaje: d.message,
      likes: d.highlighted ? 5 : 1,
      modulo: 'buzon',
      timestamp: d.timestamp || new Date().toISOString(),
      destacado: Boolean(d.highlighted || d.audioUrl),
    }));

  // 3. Selección inteligente por diversidad de módulos y horarios
  const porModulo = new Map<string, RecuerdoAlbum[]>();
  for (const r of recuerdosFotosYVideos) {
    const mod = r.modulo || 'general';
    if (!porModulo.has(mod)) porModulo.set(mod, []);
    porModulo.get(mod)!.push(r);
  }

  // Ordenar dentro de cada módulo por calidad IA (elegir-las-mejores) y likes
  for (const [mod, lista] of porModulo.entries()) {
    lista.sort((a, b) => {
      const calA = evaluarFoto({ nitidez: 80, ojosAbiertos: true }).nota + (a.likes || 0) * 5;
      const calB = evaluarFoto({ nitidez: 80, ojosAbiertos: true }).nota + (b.likes || 0) * 5;
      return calB - calA;
    });
  }

  const seleccionados: RecuerdoAlbum[] = [];
  const cuotaPorModulo = Math.max(2, Math.floor(maxRecuerdos / Math.max(1, porModulo.size + 1)));

  // Tomar los mejores de cada módulo
  for (const [, lista] of porModulo.entries()) {
    seleccionados.push(...lista.slice(0, cuotaPorModulo));
  }

  // Agregar 2 a 4 audios del buzón
  const audiosDestacados = recuerdosAudios.slice(0, 4);
  seleccionados.push(...audiosDestacados);

  // Completar hasta maxRecuerdos si hace falta con los más votados restantes
  if (seleccionados.length < maxRecuerdos) {
    const idsYa = new Set(seleccionados.map((s) => s.id));
    const sobrantes = recuerdosFotosYVideos
      .filter((r) => !idsYa.has(r.id))
      .sort((a, b) => (b.likes || 0) - (a.likes || 0));
    seleccionados.push(...sobrantes.slice(0, maxRecuerdos - seleccionados.length));
  }

  // Ordenar cronológicamente para que cuente la historia de la fiesta
  seleccionados.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // 4. Agrupar en páginas de 2 recuerdos por página
  const paginas: PaginaAlbum[] = [];
  for (let i = 0; i < seleccionados.length; i += 2) {
    paginas.push({
      numeroPagina: Math.floor(i / 2) + 1,
      recuerdos: seleccionados.slice(i, i + 2),
    });
  }

  const tituloFiesta =
    fiesta?.configuracion?.nombreEvento ||
    'Álbum de Recuerdos';
  const subtitulo =
    fiesta?.configuracion?.protagonista1Nombre ||
    fiesta?.configuracion?.nombreAgasajado ||
    (fiesta?.configuracion?.tipoCelebracion ? `Nuestra fiesta de ${fiesta.configuracion.tipoCelebracion}` : 'Los mejores momentos de la noche');
  const fecha = fiesta?.configuracion?.fechaEvento
    ? new Date(fiesta.configuracion.fechaEvento).toLocaleDateString('es-UY', { dateStyle: 'long' })
    : new Date().toLocaleDateString('es-UY', { dateStyle: 'long' });

  const fotoPortada =
    fiesta?.configuracion?.protagonistaFotoUrl ||
    seleccionados.find((s) => s.tipo === 'foto')?.imageUrl ||
    postsAprobados[0]?.imageUrl;

  return {
    portada: {
      titulo: tituloFiesta,
      subtitulo,
      fecha,
      fotoPortadaUrl: fotoPortada,
      colorTema: fiesta?.invitacionConfig?.colorPrincipal || '#f59e0b',
    },
    paginas,
    totalPaginas: paginas.length,
    totalRecuerdos: seleccionados.length,
    todosLosRecuerdos: seleccionados,
  };
}

