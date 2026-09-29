export type CommentNetwork = 'Facebook' | 'Instagram' | 'YouTube';

export type CommentSentiment = 'positivo' | 'neutro' | 'negativo';

export interface SocialComment {
  id: string; // ej: fb_123456_com_789
  network: CommentNetwork;
  networkCommentId: string;
  postId: string;
  postTitle?: string;
  postUrl?: string;
  authorName: string;
  authorId?: string;
  authorProfileUrl?: string;
  text: string;
  createdAt: string; // ISO String
  permalink?: string;
  
  // Clasificación por IA
  sentiment?: CommentSentiment;
  sentimentReason?: string;
  isInsultOrSpam?: boolean;
  isLegitimateComplaint?: boolean;
  classifiedAt?: string;

  // Moderación y Estado
  isAutoHidden?: boolean;
  autoHiddenReason?: string;
  autoHiddenAt?: string;
  isManuallyRestored?: boolean;
  manuallyRestoredAt?: string;
  isDeleted?: boolean;

  // Conversión a Testimonio Público
  isTestimonialApproved?: boolean;
  testimonialScreenshotUrl?: string;
  approvedAsTestimonialAt?: string;
}

export interface NetworkCommentsBackfillState {
  accountId?: string;
  lastAttemptAt?: string;
  lastSyncAt?: string;
  fetchedCount: number;
  newCommentsCount: number;
  oldestDate?: string;
  newestDate?: string;
  exhausted: boolean;
  cursor?: string;
  error?: string;
}

export interface CommentsSyncSummary {
  success: boolean;
  totalFetched: number;
  totalNew: number;
  totalAutoHidden: number;
  /** Cuantos se mandaron a la inteligencia artificial en esta corrida. */
  totalClasificados: number;
  /**
   * Cuantos quedaron guardados pero sin revisar, porque se llego al tope de la
   * corrida o porque se acabo el presupuesto de inteligencia artificial. Se
   * toman en la corrida siguiente.
   */
  pendientesDeClasificar: number;
  platforms: Record<CommentNetwork, NetworkCommentsBackfillState>;
  syncedAt: string;
}
