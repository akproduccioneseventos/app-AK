export interface TriviaQuestion {
  id: string;
  question: string;
  options: { id: string; text: string; emoji?: string }[];
  correctOptionId: string;
  timeLimitSeconds?: number;
}

export interface PhotoMission {
  id: string;
  title: string;
  description: string;
  emoji: string;
  points: number;
}

export interface TriviaGame {
  id: string;
  fiestaId: string;
  title: string;
  questions: TriviaQuestion[];
  createdAt: string;
  status: 'draft' | 'active' | 'finished';
}

export interface TriviaParticipant {
  guestId: string;
  guestName: string;
  score: number;
  answers: { questionId: string; answerId: string; correct: boolean; answeredAt: string }[];
}

export interface Leaderboard {
  participants: TriviaParticipant[];
  topThree: TriviaParticipant[];
}

export const DEFAULT_TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 'q1',
    question: '¿Quién llegó primero a la fiesta?',
    options: [
      { id: 'a', text: 'El DJ', emoji: '🎧' },
      { id: 'b', text: 'La abuela', emoji: '👵' },
      { id: 'c', text: 'El tío borracho', emoji: '🍺' },
      { id: 'd', text: 'Nadie sabe', emoji: '🤷' }
    ],
    correctOptionId: 'a',
    timeLimitSeconds: 15
  },
  {
    id: 'q2',
    question: '¿Cuál es la canción favorita del/la festejado/a?',
    options: [
      { id: 'a', text: 'Despacito', emoji: '🎸' },
      { id: 'b', text: 'La Macarena', emoji: '💃' },
      { id: 'c', text: 'Muchachos', emoji: '⚽' },
      { id: 'd', text: 'No tiene', emoji: '🤐' }
    ],
    correctOptionId: 'c',
    timeLimitSeconds: 15
  },
  {
    id: 'q3',
    question: '¿Cuántos años cumple el/la festejado/a?',
    options: [
      { id: 'a', text: '18', emoji: '🔞' },
      { id: 'b', text: '21', emoji: '🔑' },
      { id: 'c', text: '30', emoji: '🎉' },
      { id: 'd', text: 'Un misterio', emoji: '❓' }
    ],
    correctOptionId: 'd',
    timeLimitSeconds: 15
  },
  {
    id: 'q4',
    question: '¿Qué trago es el más pedido de la noche?',
    options: [
      { id: 'a', text: 'Fernet', emoji: '🥤' },
      { id: 'b', text: 'Cerveza', emoji: '🍺' },
      { id: 'c', text: 'Gancia', emoji: '🍸' },
      { id: 'd', text: 'Agua', emoji: '💧' }
    ],
    correctOptionId: 'a',
    timeLimitSeconds: 15
  },
  {
    id: 'q5',
    question: '¿Quién va a ser el último en irse?',
    options: [
      { id: 'a', text: 'Los padres', emoji: '👨‍👩‍👧' },
      { id: 'b', text: 'Los primos', emoji: '👯' },
      { id: 'c', text: 'El grupo del club', emoji: '⚽' },
      { id: 'd', text: 'El personal de limpieza', emoji: '🧹' }
    ],
    correctOptionId: 'c',
    timeLimitSeconds: 15
  }
];

export const DEFAULT_PHOTO_MISSIONS: PhotoMission[] = [
  { id: 'm1', title: 'Selfie con los festejados', description: 'Atrapá a los anfitriones y sacate una selfie', emoji: '🤳', points: 100 },
  { id: 'm2', title: 'Foto brindando en la pista', description: 'Un chin chin en el medio del baile', emoji: '🥂', points: 50 },
  { id: 'm3', title: 'Foto grupal de tu mesa', description: 'Todos sonriendo a la cámara', emoji: '📸', points: 80 },
  { id: 'm4', title: 'Capturá el mejor paso de baile', description: 'Ese movimiento inolvidable', emoji: '💃', points: 150 },
  { id: 'm5', title: 'Foto con la torta', description: 'Antes de que la corten', emoji: '🎂', points: 70 }
];

export function calculateLeaderboard(participants: TriviaParticipant[]): Leaderboard {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  return {
    participants: sorted,
    topThree: sorted.slice(0, 3)
  };
}

export function checkTriviaAnswer(question: TriviaQuestion, answerId: string): boolean {
  return question.correctOptionId === answerId;
}
