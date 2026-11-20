import type { ActiveGameData, FiestaEnPlanificacion } from '@/types/fiesta';
import type { SocialGalleryPost, SocialPoll, SongRequest } from '@/types/social-gallery';
import { esAprobadoParaMostrar } from '@/lib/social-fiesta/visibilidad';
import { getGuestPartySize } from '@/lib/fiesta/guest-counts';

export interface GuestPresenceRecord {
  visitorKey: string;
  fiestaId: string;
  guestId?: string;
  tableNumber?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface LiveEventStats {
  invitadosEntraron: number;
  invitadosAhora: number;
  fotosSubidas: number;
  fotosAprobadas: number;
  votos: number;
  mesaMasActiva: { mesa: string; actividad: number } | null;
}

const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

export function calcularEstadisticasEnVivo(input: {
  invitados?: FiestaEnPlanificacion['invitados'];
  presences?: GuestPresenceRecord[];
  posts?: SocialGalleryPost[];
  polls?: SocialPoll[];
  songs?: SongRequest[];
  activeGame?: ActiveGameData | null;
  triviaParticipants?: NonNullable<FiestaEnPlanificacion['triviaGame']>['participants'];
  nowMs?: number;
}): LiveEventStats {
  const nowMs = input.nowMs ?? Date.now();
  const invitados = input.invitados ?? [];
  const presences = input.presences ?? [];
  const posts = input.posts ?? [];
  const polls = input.polls ?? [];
  const songs = input.songs ?? [];
  const triviaParticipants = input.triviaParticipants ?? [];

  // 1. Invitados que entraron (check-in real o visitantes únicos en el muro sin duplicar guestId)
  const seenGuestIds = new Set<string>();
  let checkedInCount = 0;
  for (const inv of invitados) {
    if (inv.checkedIn) {
      checkedInCount += getGuestPartySize(inv);
      if (inv.id) seenGuestIds.add(inv.id);
    }
  }

  const seenVisitorKeys = new Set<string>();
  let onlineVisitorExtras = 0;
  let invitadosAhora = 0;

  for (const p of presences) {
    if (!p.visitorKey || seenVisitorKeys.has(p.visitorKey)) continue;
    seenVisitorKeys.add(p.visitorKey);

    const lastSeenMs = Date.parse(p.lastSeenAt);
    if (Number.isFinite(lastSeenMs) && nowMs - lastSeenMs <= ACTIVE_WINDOW_MS) {
      invitadosAhora += 1;
    }

    if (!p.guestId || !seenGuestIds.has(p.guestId)) {
      onlineVisitorExtras += 1;
    }
  }

  const invitadosEntraron = checkedInCount + onlineVisitorExtras;

  // 2. Fotos subidas y aprobadas
  const fotosSubidas = posts.length;
  const fotosAprobadas = posts.filter((p) => esAprobadoParaMostrar(p)).length;

  // 3. Votos totales reales (likes + encuestas + canciones + juegos + trivia)
  const likesCount = posts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const pollVotes = polls.reduce(
    (acc, poll) => acc + (poll.options || []).reduce((s, o) => s + (o.votes || 0), 0),
    0,
  );
  const songVotes = songs.reduce((acc, s) => acc + (s.votes || 0), 0);
  const gameVotes = (input.activeGame?.options || []).reduce((acc, o) => acc + (o.votes || 0), 0);
  const triviaAnswers = triviaParticipants.reduce(
    (acc, tp) => acc + (tp.answers?.length || 0),
    0,
  );
  const votos = likesCount + pollVotes + songVotes + gameVotes + triviaAnswers;

  // 4. Mesa más activa (sin inventar si no hay actividad asociada a mesas)
  const guestTableById = new Map<string, string>();
  for (const inv of invitados) {
    if (inv.id && inv.tableNumber?.trim()) {
      guestTableById.set(inv.id, inv.tableNumber.trim());
    }
  }

  const tableActivity = new Map<string, number>();
  const addTableActivity = (mesa?: string, weight: number = 1) => {
    const clean = mesa?.trim();
    if (!clean) return;
    tableActivity.set(clean, (tableActivity.get(clean) || 0) + weight);
  };

  for (const p of presences) {
    addTableActivity(p.tableNumber || (p.guestId ? guestTableById.get(p.guestId) : undefined), 1);
  }
  for (const tp of triviaParticipants) {
    addTableActivity(tp.tableNumber, Math.max(1, tp.answers?.length || 1));
  }
  for (const post of posts) {
    if (post.guestId) {
      addTableActivity(guestTableById.get(post.guestId), 2);
    }
  }

  let mesaMasActiva: { mesa: string; actividad: number } | null = null;
  for (const [mesa, actividad] of tableActivity.entries()) {
    if (!mesaMasActiva || actividad > mesaMasActiva.actividad) {
      mesaMasActiva = { mesa, actividad };
    }
  }

  return {
    invitadosEntraron,
    invitadosAhora,
    fotosSubidas,
    fotosAprobadas,
    votos,
    mesaMasActiva,
  };
}

export function formatearDatoEstadistica(valor: number): string {
  return valor > 0 ? String(valor) : 'Sin datos todavía';
}
