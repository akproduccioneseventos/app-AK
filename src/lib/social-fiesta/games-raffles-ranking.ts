import type { FiestaSocialPost } from './private-feed';

export type FiestaGameType =
  | 'foto_mas_divertida'
  | 'mesa_mas_activa'
  | 'selfie_con_homenajeado'
  | 'foto_bailando'
  | 'mensaje_mas_emotivo'
  | 'sorteo_participantes'
  | 'pedido_musica';

export type FiestaGameStatus = 'draft' | 'active' | 'closed' | 'archived';

export type FiestaGameChallenge = {
  id: string;
  fiestaId: string;
  type: FiestaGameType;
  title: string;
  description: string;
  status: FiestaGameStatus;
  startsAt?: string;
  endsAt?: string;
  prizeDescription?: string;
  showOnLiveWall: boolean;
  softSellingText?: string;
};

export type FiestaGameParticipation = {
  id: string;
  challengeId: string;
  postId?: string;
  guestId?: string;
  guestName: string;
  tableName?: string;
  score: number;
  votes: number;
  createdAt: string;
};

export type FiestaRankingRow = {
  position: number;
  label: string;
  score: number;
  votes: number;
  tableName?: string;
};

export type FiestaRaffleResult = {
  winner?: FiestaGameParticipation;
  eligibleCount: number;
  seed: string;
  message: string;
};

const DEFAULT_CHALLENGE_COPY: Record<FiestaGameType, Pick<FiestaGameChallenge, 'title' | 'description' | 'softSellingText'>> = {
  foto_mas_divertida: {
    title: 'Foto mas divertida',
    description: 'Subi una foto divertida y participá por aparecer en la pantalla de la fiesta.',
    softSellingText: 'AK convierte cada momento espontaneo en parte de la experiencia.',
  },
  mesa_mas_activa: {
    title: 'Mesa mas activa',
    description: 'La mesa que mas participe suma puntos para el ranking en vivo.',
    softSellingText: 'Cuando la fiesta esta conectada, todos participan.',
  },
  selfie_con_homenajeado: {
    title: 'Selfie con el protagonista',
    description: 'Buscá al homenajeado, sacate una selfie y subila al muro.',
    softSellingText: 'Los recuerdos mas lindos tambien nacen de los invitados.',
  },
  foto_bailando: {
    title: 'Foto bailando',
    description: 'Capturá el mejor momento de la pista y subilo al muro social.',
    softSellingText: 'La pista tambien cuenta la historia de la noche.',
  },
  mensaje_mas_emotivo: {
    title: 'Mensaje mas emotivo',
    description: 'Dejá un mensaje especial para guardar como recuerdo de la fiesta.',
    softSellingText: 'No solo entregamos fotos: ayudamos a guardar emociones.',
  },
  sorteo_participantes: {
    title: 'Sorteo entre participantes',
    description: 'Participá subiendo fotos, mensajes o votando en la red social de la fiesta.',
    softSellingText: 'Una experiencia interactiva creada por AK Producciones.',
  },
  pedido_musica: {
    title: 'Pedido de musica',
    description: 'Pedí una canción para la fiesta. El equipo decide si entra en la playlist.',
    softSellingText: 'La música tambien puede estar conectada con los invitados.',
  },
};

function createId(prefix: string, value: string): string {
  return `${prefix}_${value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildFiestaGameChallenge(input: {
  fiestaId: string;
  type: FiestaGameType;
  status?: FiestaGameStatus;
  prizeDescription?: string;
  startsAt?: string;
  endsAt?: string;
}): FiestaGameChallenge {
  const copy = DEFAULT_CHALLENGE_COPY[input.type];
  return {
    id: createId('challenge', `${input.fiestaId}_${input.type}`),
    fiestaId: input.fiestaId,
    type: input.type,
    title: copy.title,
    description: copy.description,
    status: input.status ?? 'draft',
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    prizeDescription: input.prizeDescription,
    showOnLiveWall: true,
    softSellingText: copy.softSellingText,
  };
}

export function buildDefaultFiestaGameSet(fiestaId: string): FiestaGameChallenge[] {
  return [
    'foto_mas_divertida',
    'mesa_mas_activa',
    'selfie_con_homenajeado',
    'foto_bailando',
    'mensaje_mas_emotivo',
    'sorteo_participantes',
  ].map(type => buildFiestaGameChallenge({ fiestaId, type: type as FiestaGameType, status: 'draft' }));
}

export function buildParticipationFromPost(input: {
  challengeId: string;
  post: FiestaSocialPost;
  guestId?: string;
  tableName?: string;
  now?: string;
}): FiestaGameParticipation | undefined {
  if (input.post.reviewStatus !== 'approved' || !input.post.showOnBigScreen) return undefined;
  const now = input.now ?? new Date().toISOString();
  const votes = Object.values(input.post.reactions).reduce((sum, value) => sum + value, 0);
  const hasMediaBonus = input.post.imageUrl || input.post.videoUrl ? 5 : 0;
  return {
    id: createId('participation', `${input.challengeId}_${input.post.id}`),
    challengeId: input.challengeId,
    postId: input.post.id,
    guestId: input.guestId,
    guestName: input.post.authorName || 'Invitado',
    tableName: input.tableName,
    score: votes + hasMediaBonus + 1,
    votes,
    createdAt: now,
  };
}

export function buildRanking(participations: FiestaGameParticipation[]): FiestaRankingRow[] {
  return [...participations]
    .sort((a, b) => b.score - a.score || b.votes - a.votes || a.createdAt.localeCompare(b.createdAt))
    .map((item, index) => ({
      position: index + 1,
      label: item.guestName,
      score: item.score,
      votes: item.votes,
      tableName: item.tableName,
    }));
}

export function buildTableRanking(participations: FiestaGameParticipation[]): FiestaRankingRow[] {
  const tableScores = new Map<string, { score: number; votes: number }>();
  participations.forEach(participation => {
    const tableName = participation.tableName || 'Sin mesa';
    const current = tableScores.get(tableName) ?? { score: 0, votes: 0 };
    tableScores.set(tableName, {
      score: current.score + participation.score,
      votes: current.votes + participation.votes,
    });
  });

  return Array.from(tableScores.entries())
    .map(([tableName, value]) => ({ tableName, label: tableName, score: value.score, votes: value.votes, position: 0 }))
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .map((row, index) => ({ ...row, position: index + 1 }));
}

function seededIndex(seed: string, max: number): number {
  const total = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return max === 0 ? 0 : total % max;
}

export function drawFiestaRaffle(input: {
  participations: FiestaGameParticipation[];
  seed: string;
  minScore?: number;
}): FiestaRaffleResult {
  const minScore = input.minScore ?? 1;
  const eligible = input.participations.filter(item => item.score >= minScore);
  if (eligible.length === 0) {
    return {
      eligibleCount: 0,
      seed: input.seed,
      message: 'No hay participantes habilitados para el sorteo.',
    };
  }

  const winner = eligible[seededIndex(input.seed, eligible.length)];
  return {
    winner,
    eligibleCount: eligible.length,
    seed: input.seed,
    message: `Ganador: ${winner.guestName}`,
  };
}

export function buildGameLiveWallTitle(challenge: FiestaGameChallenge): string {
  if (challenge.prizeDescription) {
    return `${challenge.title} · Premio: ${challenge.prizeDescription}`;
  }
  return challenge.title;
}
