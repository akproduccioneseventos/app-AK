
export interface SocialComment {
  id: string;
  authorName: string;
  text: string;
  timestamp: string; // ISO Date String
  highlighted?: boolean;
}

export interface SocialGalleryPost {
  id: string;
  fiestaId: string;
  imageUrl: string;
  authorName: string;
  timestamp: string; // ISO Date String
  likes: number;
  comments: SocialComment[];
  dedication?: string;
  momentTag?: string;
  /** SHA-256 hex hash of the image content — used to reject duplicate uploads */
  imageHash?: string;
}

export interface ChatMessage {
  id: string;
  fiestaId: string;
  authorName: string;
  text: string;
  timestamp: string; // ISO Date String
}

export interface SocialPoll {
  id: string;
  fiestaId: string;
  question: string;
  options: { id: string; text: string; votes: number }[];
  createdAt: string;
  active: boolean;
}

export interface SongRequest {
  id: string;
  fiestaId: string;
  song: string;
  requestedBy: string;
  timestamp: string;
  played: boolean;
  votes: number;
}

export interface Dedication {
  id: string;
  fiestaId: string;
  message: string;
  authorName: string;
  timestamp: string;
  highlighted?: boolean;
}

export interface SorteoParticipant {
  nombre: string;
  source: 'invitado' | 'redes';
  timestamp: string;
}

export interface FiestaMomento {
  id: string;
  emoji: string;
  nombre: string;
  activatedAt?: string;
}
