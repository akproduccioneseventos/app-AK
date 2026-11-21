import { formatearFechaEvento } from '@/lib/fechas/formato-fecha-evento';
/**
 * ARMADOR INTELIGENTE DEL ÁLBUM DEL RECUERDO (Orden 28 + Orden 324)
 *
 * Elige de forma automática una selección balanceada de 30 a 60 recuerdos
 * (fotos, videos y mensajes de voz/buzón) para que el álbum se arme solo,
 * sin abrumar con 400 fotos idénticas.
 *
 * Criterios:
 * 1. Excluye estrictamente elementos ocultos por moderación.
 * 2. Prioriza por la nota de `calidad` de IA (1 a 3) + likes; las sin nota van después, no afuera.
 * 3. Quita fotos repetidas de la misma ráfaga.
 * 4. Balancea representación de cada estación activa (fotocabina, 360, bogue, buzon, espejo, invitados).
 * 5. Incluye 2-4 audios destacados del buzón de recuerdos.
 * 6. Agrupa en páginas de 2 recuerdos por página tipo libro físico.
 */

import type { SocialGalleryPost, Dedication, SocialPostIaRevision } from '@/types/social-gallery';
import type { FiestaEnPlanificacion } from '@/types/fiesta';
import { esAprobadoParaMostrar } from '@/lib/social-fiesta/visibilidad';

export interface RecuerdoAlbum {
  id: string;
  tipo: 'foto' | 'video' | 'audio' | 'dedicatoria';
  url?: string;
  audioUrl?: string;
  imageUrl?: string;
  autor: string;
  mensaje?: string;
  likes: number;
  calidad?: number;
  modulo?: string;
  timestamp: string;
  destacado?: boolean;
}

export interface PaginaAlbum {
  numeroPagina: number;
  recuerdos: RecuerdoAlbum[];
  momento?: string;
}

export interface SeccionAlbum {
  id: string;
  titulo: string;
  recuerdos: RecuerdoAlbum[];
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
  secciones: SeccionAlbum[];
  lasMasQueridas: RecuerdoAlbum[];
}

const VENTANA_RAFAGA_MS = 30_000;

function notaDeCalidad(post: Pick<SocialGalleryPost, 'iaRevision'>): number | undefined {
  const raw = post.iaRevision?.calidad;
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : undefined;
}

function compararRecuerdosPorCalidad(a: RecuerdoAlbum, b: RecuerdoAlbum): number {
  const tieneA = typeof a.calidad === 'number' && a.calidad > 0 ? 1 : 0;
  const tieneB = typeof b.calidad === 'number' && b.calidad > 0 ? 1 : 0;
  if (tieneA !== tieneB) return tieneB - tieneA;

  if (tieneA && tieneB) {
    const puntajeA = (a.calidad ?? 0) * 20 + (a.likes || 0);
    const puntajeB = (b.calidad ?? 0) * 20 + (b.likes || 0);
    if (puntajeB !== puntajeA) return puntajeB - puntajeA;
  }

  const likesDiff = (b.likes || 0) - (a.likes || 0);
  if (likesDiff !== 0) return likesDiff;

  return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
}

function quitarRepetidasDeRafaga(
  recuerdos: RecuerdoAlbum[],
  hashesPorId: Map<string, string | undefined>,
): RecuerdoAlbum[] {
  const ordenados = [...recuerdos].sort(compararRecuerdosPorCalidad);
  const elegidos: RecuerdoAlbum[] = [];
  const hashesVistos = new Set<string>();

  for (const r of ordenados) {
    const hash = hashesPorId.get(r.id);
    if (hash) {
      if (hashesVistos.has(hash)) continue;
      hashesVistos.add(hash);
    }

    const tiempoR = new Date(r.timestamp).getTime();
    const autorR = (r.autor || '').trim().toLowerCase();
    const moduloR = r.modulo || 'general';

    const esRepetidaDeRafaga = elegidos.some((prev) => {
      if (r.imageUrl && prev.imageUrl && r.imageUrl === prev.imageUrl) return true;
      const autorPrev = (prev.autor || '').trim().toLowerCase();
      if (!autorR || autorR !== autorPrev || moduloR !== (prev.modulo || 'general')) return false;
      const tiempoPrev = new Date(prev.timestamp).getTime();
      if (!Number.isFinite(tiempoR) || !Number.isFinite(tiempoPrev)) return false;
      return tiempoR !== tiempoPrev && Math.abs(tiempoR - tiempoPrev) <= VENTANA_RAFAGA_MS;
    });

    if (!esRepetidaDeRafaga) {
      elegidos.push(r);
    }
  }

  return elegidos;
}

/**
 * Devuelve fotos o videos aprobados que todavía no tienen nota de calidad (`iaRevision.calidad`),
 * para completarlas en tandas dentro del tope mensual de IA.
 */
export function fotosSinNotaDeCalidad(
  posts: SocialGalleryPost[],
  limite = 10,
): SocialGalleryPost[] {
  const tope = Math.max(0, Math.floor(limite));
  if (tope === 0) return [];
  return (posts ?? [])
    .filter((p) => p.moderationStatus !== 'hidden' && esAprobadoParaMostrar(p))
    .filter((p) => Boolean(p.imageUrl) && notaDeCalidad(p) === undefined)
    .slice(0, tope);
}

/**
 * Completa en tandas la nota de `calidad` para fotos viejas que no pasaron por Decisiones rápidas.
 * Se frena enseguida si el evaluador devuelve `null` (sin cupo, sin clave o apagado).
 */
export async function completarNotasAlbumEnTandas(params: {
  posts: SocialGalleryPost[];
  evaluarPost: (post: SocialGalleryPost) => Promise<SocialPostIaRevision | null>;
  tamanoTanda?: number;
  maxTandas?: number;
}): Promise<{
  actualizados: SocialGalleryPost[];
  frenadoPorTope: boolean;
}> {
  const tamanoTanda = Math.max(1, Math.min(10, Math.floor(params.tamanoTanda ?? 5)));
  const maxTandas = Math.max(1, Math.min(10, Math.floor(params.maxTandas ?? 2)));
  const pendientes = fotosSinNotaDeCalidad(params.posts, tamanoTanda * maxTandas);
  const actualizados: SocialGalleryPost[] = [];
  let frenadoPorTope = false;

  for (let inicio = 0; inicio < pendientes.length; inicio += tamanoTanda) {
    const tanda = pendientes.slice(inicio, inicio + tamanoTanda);
    for (const post of tanda) {
      const revision = await params.evaluarPost(post);
      if (!revision) {
        frenadoPorTope = true;
        return { actualizados, frenadoPorTope };
      }
      actualizados.push({
        ...post,
        iaRevision: {
          ...(post.iaRevision ?? {}),
          ...revision,
        },
      });
    }
  }

  return { actualizados, frenadoPorTope };
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

  const hashesPorId = new Map<string, string | undefined>();
  // Convertir posts a Recuerdos conservando la nota de calidad IA
  const recuerdosBrutos: RecuerdoAlbum[] = postsAprobados.map((p) => {
    hashesPorId.set(p.id, p.imageHash);
    return {
      id: p.id,
      tipo: (p.mediaType === 'video' ? 'video' : 'foto') as 'foto' | 'video',
      imageUrl: p.imageUrl,
      url: p.imageUrl,
      audioUrl: p.sourceModule === 'buzon' ? p.imageUrl : undefined,
      autor: p.authorName || 'Invitado',
      mensaje: p.caption || p.dedication,
      likes: p.likes || 0,
      calidad: notaDeCalidad(p),
      modulo: p.sourceModule || (p.source === 'entertainment' ? 'estacion' : 'invitados'),
      timestamp: p.timestamp || new Date().toISOString(),
      destacado: (p.likes || 0) >= 3 || (notaDeCalidad(p) ?? 0) >= 3,
    };
  });

  // Quitar repetidas de la misma ráfaga conservando las de mayor calidad + likes
  const recuerdosFotosYVideos = quitarRepetidasDeRafaga(recuerdosBrutos, hashesPorId);

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

  // 3. Selección inteligente por diversidad de módulos
  const porModulo = new Map<string, RecuerdoAlbum[]>();
  for (const r of recuerdosFotosYVideos) {
    const mod = r.modulo || 'general';
    if (!porModulo.has(mod)) porModulo.set(mod, []);
    porModulo.get(mod)!.push(r);
  }

  for (const [, lista] of porModulo.entries()) {
    lista.sort(compararRecuerdosPorCalidad);
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

  // Completar hasta maxRecuerdos si hace falta con los mejores restantes (las sin nota van después, no afuera)
  if (seleccionados.length < maxRecuerdos) {
    const idsYa = new Set(seleccionados.map((s) => s.id));
    const sobrantes = recuerdosFotosYVideos
      .filter((r) => !idsYa.has(r.id))
      .sort(compararRecuerdosPorCalidad);
    seleccionados.push(...sobrantes.slice(0, maxRecuerdos - seleccionados.length));
  }

  // Ordenar el álbum final por calidad + likes, dejando las sin nota y audios después
  seleccionados.sort(compararRecuerdosPorCalidad);

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
  const fecha = fiesta?.configuracion?.fechaEvento ? formatearFechaEvento(fiesta.configuracion.fechaEvento) : new Date().toLocaleDateString('es-UY', { dateStyle: 'long' });

  const fotoPortada =
    fiesta?.configuracion?.protagonistaFotoUrl ||
    seleccionados.find((s) => s.tipo === 'foto')?.imageUrl ||
    postsAprobados[0]?.imageUrl;

  // 5. Sección "Las más queridas de la noche": top 20 fotos aprobadas con más likes
  const lasMasQueridas = recuerdosFotosYVideos
    .filter((r) => r.tipo === 'foto')
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, 20);

  const secciones: SeccionAlbum[] = [
    {
      id: 'las-mas-queridas',
      titulo: 'Las más queridas de la noche',
      recuerdos: lasMasQueridas,
    },
  ];

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
    secciones,
    lasMasQueridas,
  };
}
