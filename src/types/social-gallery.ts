
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
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video';
  moderationStatus?: 'pending' | 'approved' | 'hidden';
  moderatedAt?: string;
  moderatedBy?: string;
  authorName: string;
  /**
   * De quién es la foto. Se guarda SÓLO cuando la persona probó tener el enlace
   * personal de ese invitado: si no, cualquiera podría mandar el identificador
   * de otro y adueñarse de sus fotos. Va opcional a propósito — el invitado que
   * no abrió su enlace sube igual, y su foto queda sin dueño.
   *
   * Sirve de acá en adelante: las fiestas viejas no tienen este dato.
   */
  guestId?: string;
  timestamp: string; // ISO Date String
  likes: number;
  comments: SocialComment[];
  dedication?: string;
  momentTag?: string;
  source?: 'guest' | 'entertainment' | string;
  sourceModule?: string;
  caption?: string;
  /** SHA-256 hex hash of the image content — used to reject duplicate uploads */
  imageHash?: string;
  drinkId?: string;
  drinkName?: string;
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
  audioUrl?: string;
  visibility?: 'public' | 'private';
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
