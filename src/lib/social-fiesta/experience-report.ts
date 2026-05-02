import type { FiestaSocialPost } from './private-feed';
import type { FiestaGameParticipation, FiestaRankingRow } from './games-raffles-ranking';
import { buildRanking, buildTableRanking } from './games-raffles-ranking';

export type FiestaExperienceMetric = {
  label: string;
  value: number;
  helper: string;
};

export type FiestaExperienceReport = {
  fiestaId: string;
  eventName: string;
  generatedAt: string;
  headline: string;
  metrics: FiestaExperienceMetric[];
  highlights: string[];
  ranking: FiestaRankingRow[];
  tableRanking: FiestaRankingRow[];
  clientSummary: string;
  marketingSummary: string;
  suggestedPostEventMessage: string;
};

function approvedPosts(posts: FiestaSocialPost[]): FiestaSocialPost[] {
  return posts.filter(post => post.reviewStatus === 'approved');
}

function mediaCount(posts: FiestaSocialPost[]): number {
  return posts.filter(post => Boolean(post.imageUrl || post.videoUrl)).length;
}

function reactionCount(posts: FiestaSocialPost[]): number {
  return posts.reduce((total, post) => {
    const values = Object.values(post.reactions ?? {});
    return total + values.reduce((sum, value) => sum + value, 0);
  }, 0);
}

function commentCount(posts: FiestaSocialPost[]): number {
  return posts.reduce((total, post) => total + (post.comments?.length ?? 0), 0);
}

function uniqueAuthorCount(posts: FiestaSocialPost[]): number {
  return new Set(posts.map(post => post.authorName).filter(Boolean)).size;
}

export function buildFiestaExperienceMetrics(input: {
  posts: FiestaSocialPost[];
  participations: FiestaGameParticipation[];
}): FiestaExperienceMetric[] {
  const approved = approvedPosts(input.posts);
  return [
    {
      label: 'Publicaciones aprobadas',
      value: approved.length,
      helper: 'Contenido real generado por invitados, cliente y AK.',
    },
    {
      label: 'Fotos y videos',
      value: mediaCount(approved),
      helper: 'Material visual compartido para muro y recuerdos.',
    },
    {
      label: 'Reacciones',
      value: reactionCount(approved),
      helper: 'Interacciones que muestran participación de los invitados.',
    },
    {
      label: 'Comentarios',
      value: commentCount(approved),
      helper: 'Mensajes y conversación dentro de la experiencia digital.',
    },
    {
      label: 'Participantes únicos',
      value: uniqueAuthorCount(approved),
      helper: 'Personas que participaron activamente en la red social de la fiesta.',
    },
    {
      label: 'Participaciones en juegos',
      value: input.participations.length,
      helper: 'Interacciones usadas para desafíos, ranking y sorteos.',
    },
  ];
}

export function buildFiestaExperienceHighlights(input: {
  posts: FiestaSocialPost[];
  participations: FiestaGameParticipation[];
}): string[] {
  const metrics = buildFiestaExperienceMetrics(input);
  const findMetric = (label: string) => metrics.find(metric => metric.label === label)?.value ?? 0;
  const highlights: string[] = [];

  if (findMetric('Fotos y videos') > 0) {
    highlights.push(`Se compartieron ${findMetric('Fotos y videos')} fotos/videos durante la experiencia.`);
  }
  if (findMetric('Reacciones') > 0) {
    highlights.push(`Los invitados dejaron ${findMetric('Reacciones')} reacciones.`);
  }
  if (findMetric('Participaciones en juegos') > 0) {
    highlights.push(`Hubo ${findMetric('Participaciones en juegos')} participaciones en juegos, ranking o sorteos.`);
  }
  if (highlights.length === 0) {
    highlights.push('La experiencia digital quedó preparada para activar participación en próximos eventos.');
  }

  return highlights;
}

export function buildFiestaExperienceReport(input: {
  fiestaId: string;
  eventName: string;
  posts: FiestaSocialPost[];
  participations: FiestaGameParticipation[];
  generatedAt?: string;
}): FiestaExperienceReport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const metrics = buildFiestaExperienceMetrics({ posts: input.posts, participations: input.participations });
  const highlights = buildFiestaExperienceHighlights({ posts: input.posts, participations: input.participations });
  const ranking = buildRanking(input.participations).slice(0, 5);
  const tableRanking = buildTableRanking(input.participations).slice(0, 5);

  const clientSummary = `${input.eventName} tuvo una experiencia digital conectada: invitación, red social, muro, juegos y recuerdos en un mismo flujo.`;
  const marketingSummary = `AK Producciones no solo organiza la fiesta: crea una experiencia tecnológica que conecta invitados, pantalla, juegos y recuerdos.`;

  return {
    fiestaId: input.fiestaId,
    eventName: input.eventName,
    generatedAt,
    headline: `Reporte de experiencia digital · ${input.eventName}`,
    metrics,
    highlights,
    ranking,
    tableRanking,
    clientSummary,
    marketingSummary,
    suggestedPostEventMessage: buildSuggestedPostEventMessage({
      eventName: input.eventName,
      photos: metrics.find(metric => metric.label === 'Fotos y videos')?.value ?? 0,
      reactions: metrics.find(metric => metric.label === 'Reacciones')?.value ?? 0,
    }),
  };
}

export function buildSuggestedPostEventMessage(input: {
  eventName: string;
  photos: number;
  reactions: number;
}): string {
  return `La fiesta de ${input.eventName} no terminó en la pista: también quedó guardada en una experiencia digital con ${input.photos} fotos/videos y ${input.reactions} reacciones de los invitados. AK Producciones conecta cada detalle para que el recuerdo siga después del evento.`;
}

export function buildOperatorReportChecklist(report: FiestaExperienceReport): string[] {
  return [
    'Revisar publicaciones destacadas para usar en redes sociales.',
    'Descargar material temporal antes de limpiar Storage.',
    'Actualizar link del álbum final en el portal del cliente.',
    report.ranking.length > 0 ? 'Publicar ganadores de juegos o ranking.' : 'Activar juegos en la próxima fiesta para aumentar interacción.',
    'Usar el resumen como prueba de valor comercial de AK Producciones.',
  ];
}
